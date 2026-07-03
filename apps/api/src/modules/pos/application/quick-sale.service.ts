import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PosRepository } from '../domain/pos.repository.interface';

@Injectable()
export class QuickSaleService {
  constructor(
    @Inject('PosRepository') private readonly posRepo: PosRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: {
    tenantId: string; clientId: string; cashRegisterId: string;
    subtotal: number; taxAmount: number; total: number; currency: string;
    notes?: string; paymentMethod: string;
    items: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }>;
    userId: string;
  }) {
    const session = await this.posRepo.findOpenSession(data.tenantId, data.cashRegisterId);
    if (!session) throw new BadRequestException('No open session for this register. Open a session first.');

    const documentId = crypto.randomUUID();

    const order = await this.prisma.salesOrder.create({
      data: {
        tenantId: data.tenantId,
        documentId,
        clientId: data.clientId,
        status: 'approved',
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        total: data.total,
        currency: data.currency,
        notes: data.notes ?? null,
        type: 'pos',
      },
    });

    await this.prisma.cashMovement.create({
      data: {
        registerId: data.cashRegisterId,
        type: 'in',
        amount: data.total,
        referenceType: 'sales_order',
        referenceId: order.id,
        description: `POS sale ${documentId} via ${data.paymentMethod}`,
        userId: data.userId,
      },
    });

    this.eventEmitter.emit('document.created', {
      eventType: 'document.created',
      tenantId: data.tenantId,
      documentId,
      documentType: 'sales_order',
      timestamp: new Date().toISOString(),
      triggeredBy: data.userId,
      metadata: {
        clientId: data.clientId,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        total: data.total,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        lines: data.items,
        source: 'pos',
        sessionId: session.id,
      },
    });

    return { documentId, sessionId: session.id, status: 'approved', orderId: order.id };
  }
}
