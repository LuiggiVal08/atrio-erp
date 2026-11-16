import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PosRepository } from '../domain/pos.repository.interface';

interface PaymentAllocation {
  method: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  bankName?: string;
  reference?: string;
  details?: string;
}

const PAYMENT_METHODS = new Set([
  'cash',
  'card',
  'transfer',
  'mobile_payment',
  'digital',
  'point',
  'other',
]);
const PAYMENT_EPSILON = 0.01;
const WALK_IN_DOCUMENT_ID = 'CONSUMIDOR-FINAL';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class QuickSaleService {
  constructor(
    @Inject('PosRepository') private readonly posRepo: PosRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: {
    tenantId: string; clientId?: string | null; cashRegisterId: string;
    subtotal: number; taxAmount: number; total: number; currency: string;
    notes?: string; paymentMethod: string;
    paymentAllocations?: PaymentAllocation[];
    items: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }>;
    userId: string;
  }) {
    if (!data.tenantId) throw new BadRequestException('Tenant context is required');
    if (!data.items.length || data.items.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0)) throw new BadRequestException('Item quantity must be positive and finite');
    const session = await this.posRepo.findOpenSession(data.tenantId, data.cashRegisterId);
    if (!session) throw new BadRequestException('No open session for this register. Open a session first.');

    const { allocations, paid, change } = this.resolveAllocations(data);
    const clientId =
      data.clientId && UUID_PATTERN.test(data.clientId)
        ? data.clientId
        : await this.ensureWalkInClient(data.tenantId);
    const documentId = crypto.randomUUID();

    const cashAmount = allocations
      .filter((allocation) => allocation.method === 'cash')
      .reduce((sum, allocation) => sum + allocation.amount * allocation.exchangeRate, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.salesOrder.create({
        data: {
          tenantId: data.tenantId,
          documentId,
          clientId,
          status: 'approved',
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          total: data.total,
          currency: data.currency,
          notes: data.notes ?? null,
          type: 'pos',
        },
      });

      if (cashAmount > 0) {
        await tx.cashRegister.update({
          where: { id: data.cashRegisterId },
          data: { balance: { increment: round2(cashAmount) } },
        });
      }

      await tx.cashMovement.createMany({
        data: allocations.map((allocation) => ({
          registerId: data.cashRegisterId,
          type: 'in',
          amount: allocation.amount,
          currency: allocation.currency,
          exchangeRate: allocation.exchangeRate,
          baseAmount: round2(allocation.amount * allocation.exchangeRate),
          paymentMethod: allocation.method,
          sessionId: session.id,
          referenceType: 'sales_order',
          referenceId: created.id,
          description: `POS sale ${documentId}`,
          userId: data.userId,
        })),
      });

      for (const item of data.items) {
        const stockClient = (tx as any).stock;
        const conditionalDecrement = typeof stockClient?.updateMany === 'function';
        const current = await stockClient.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
          select: { quantity: true, committedQuantity: true },
        });
        const physical = Number(current?.quantity ?? 0);
        const committed = Number(current?.committedQuantity ?? 0);
        if (!current || physical - committed < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para el producto ${item.productId}`);
        }
        if (conditionalDecrement) {
          const updated = await stockClient.updateMany({
            where: {
              productId: item.productId, warehouseId: item.warehouseId,
              quantity: physical, committedQuantity: committed,
              product: { tenantId: data.tenantId, isActive: true, deletedAt: null, isService: false },
              warehouse: { tenantId: data.tenantId, isActive: true, OR: [{ branchId: null }, { branch: { tenantId: data.tenantId, isActive: true } }] },
            },
            data: { quantity: { decrement: item.quantity } },
          });
          if (updated.count !== 1) throw new BadRequestException(`Stock insuficiente para el producto ${item.productId}`);
        } else {
          await stockClient.update({
            where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        const stockAfter = typeof stockClient?.findUniqueOrThrow === 'function'
          ? await stockClient.findUniqueOrThrow({ where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } } })
          : await stockClient.findUnique({ where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } } });

        const stockLotClient = (tx as any).stockLot;
        if (stockLotClient && typeof stockLotClient.findMany === 'function') {
          const lots = await stockLotClient.findMany({ where: { tenantId: data.tenantId, productId: item.productId, warehouseId: item.warehouseId, quantity: { gt: 0 } }, select: { quantity: true } });
          if (lots.reduce((sum: number, lot: { quantity: number }) => sum + lot.quantity, 0) > stockAfter.quantity) {
            throw new BadRequestException('Select a lot through inventory: unallocated stock is insufficient');
          }
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: item.warehouseId,
            type: 'out',
            quantity: item.quantity,
            referenceType: 'sales_order',
            referenceId: created.id,
            userId: data.userId,
            balanceBefore: stockAfter.quantity + item.quantity,
            balanceAfter: stockAfter.quantity,
          },
        });
      }

      return created;
    });

    this.eventEmitter.emit('document.created', {
      eventType: 'document.created',
      tenantId: data.tenantId,
      documentId,
      documentType: 'sales_order',
      timestamp: new Date().toISOString(),
      triggeredBy: data.userId,
      metadata: {
        clientId,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        total: data.total,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentAllocations: allocations,
        lines: data.items,
        source: 'pos',
        sessionId: session.id,
      },
    });

    return {
      documentId,
      sessionId: session.id,
      status: 'approved',
      orderId: order.id,
      total: data.total,
      paid,
      change,
    };
  }

  private resolveAllocations(data: {
    total: number; currency: string; paymentMethod: string;
    paymentAllocations?: PaymentAllocation[];
  }): { allocations: PaymentAllocation[]; paid: number; change: number } {
    const allocations: PaymentAllocation[] = data.paymentAllocations?.length
      ? data.paymentAllocations
      : [{ method: data.paymentMethod, amount: data.total, currency: data.currency, exchangeRate: 1 }];

    let paid = 0;
    let nonCash = 0;

    for (const allocation of allocations) {
      if (!PAYMENT_METHODS.has(allocation.method)) {
        throw new BadRequestException(`Método de pago no válido: ${allocation.method}`);
      }
      if (!Number.isFinite(allocation.amount) || allocation.amount <= 0) {
        throw new BadRequestException('Cada pago debe tener un monto mayor a 0');
      }
      if (!Number.isFinite(allocation.exchangeRate) || allocation.exchangeRate <= 0) {
        throw new BadRequestException('Cada pago debe tener una tasa de cambio mayor a 0');
      }

      const baseAmount = allocation.amount * allocation.exchangeRate;
      paid += baseAmount;
      if (allocation.method !== 'cash') nonCash += baseAmount;
    }

    if (paid + PAYMENT_EPSILON < data.total) {
      throw new BadRequestException('El pago no cubre el total de la venta');
    }
    if (nonCash > data.total + PAYMENT_EPSILON) {
      throw new BadRequestException(
        'Solo el efectivo puede exceder el total; el vuelto se entrega en efectivo',
      );
    }

    return {
      allocations,
      paid: round2(paid),
      change: round2(Math.max(0, paid - data.total)),
    };
  }

  private async ensureWalkInClient(tenantId: string): Promise<string> {
    const client = await this.prisma.client.upsert({
      where: { tenantId_documentId: { tenantId, documentId: WALK_IN_DOCUMENT_ID } },
      update: {},
      create: {
        tenantId,
        documentId: WALK_IN_DOCUMENT_ID,
        legalName: 'Consumidor Final',
        taxId: 'V-0',
      },
      select: { id: true },
    });
    return client.id;
  }
}
