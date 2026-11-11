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
    const session = await this.posRepo.findOpenSession(data.tenantId, data.cashRegisterId);
    if (!session) throw new BadRequestException('No open session for this register. Open a session first.');

    const { allocations, paid, change } = this.resolveAllocations(data);
    const clientId =
      data.clientId && UUID_PATTERN.test(data.clientId)
        ? data.clientId
        : await this.ensureWalkInClient(data.tenantId);
    const documentId = crypto.randomUUID();

    const order = await this.prisma.salesOrder.create({
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

    const cashAmount = allocations
      .filter((allocation) => allocation.method === 'cash')
      .reduce((sum, allocation) => sum + allocation.amount * allocation.exchangeRate, 0);

    if (cashAmount > 0) {
      await this.prisma.cashRegister.update({
        where: { id: data.cashRegisterId },
        data: { balance: { increment: round2(cashAmount) } },
      });
    }

    await this.prisma.cashMovement.createMany({
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
        referenceId: order.id,
        description: `POS sale ${documentId}`,
        userId: data.userId,
      })),
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
