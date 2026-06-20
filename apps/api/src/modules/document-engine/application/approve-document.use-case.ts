import { PrismaService } from '@/infrastructure/database/prisma.service';
import { DocumentRepository } from '../domain/document.repository.interface';
import { DocumentStateMachine } from '../domain/document-state-machine';
import { DocumentStatus } from '../domain/document.entity';
import { DocumentEventEmitter } from '../infrastructure/document-event-emitter';

export interface ApproveDocumentContext {
  tenantId: string;
  userId: string;
}

export class ApproveDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly stateMachine: DocumentStateMachine,
    private readonly eventEmitter: DocumentEventEmitter,
    private readonly prisma: PrismaService,
  ) {}

  async execute(documentId: string, ctx: ApproveDocumentContext) {
    const doc = await this.documentRepository.findById(documentId, ctx.tenantId);
    if (!doc) {
      throw new Error('Document not found');
    }

    this.stateMachine.transition(doc.status, DocumentStatus.APPROVED);

    const previousStatus = doc.status;
    const now = new Date();

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { baseCurrency: true },
    });

    let exchangeRate: number | null = null;
    if (tenant && doc.currency !== tenant.baseCurrency) {
      exchangeRate = 1;
    }

    const payload = {
      approvedBy: ctx.userId,
      approvedAt: now.toISOString(),
      grandTotal: doc.grandTotal,
      currency: doc.currency,
      exchangeRate,
    };

    const [updated] = await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id: documentId, tenantId: ctx.tenantId, status: previousStatus },
        data: {
          status: DocumentStatus.APPROVED,
          approvedById: ctx.userId,
          approvedAt: now,
          ...(exchangeRate !== null ? { exchangeRate } : {}),
        },
        include: { lines: true },
      }),
      this.prisma.documentEvent.create({
        data: {
          tenantId: ctx.tenantId,
          documentId,
          eventType: 'document.approved',
          previousStatus,
          newStatus: DocumentStatus.APPROVED,
          payload,
          createdById: ctx.userId,
        },
      }),
    ]);

    this.eventEmitter.emit('document.approved', {
      eventType: 'document.approved',
      tenantId: ctx.tenantId,
      documentId,
      documentType: doc.documentType,
      timestamp: now.toISOString(),
      triggeredBy: ctx.userId,
      metadata: payload,
    });

    return this.mapToEntity(updated);
  }

  private mapToEntity(doc: any) {
    return {
      ...doc,
      exchangeRate: doc.exchangeRate ? Number(doc.exchangeRate) : null,
      subtotal: Number(doc.subtotal),
      taxTotal: Number(doc.taxTotal),
      discountTotal: Number(doc.discountTotal),
      grandTotal: Number(doc.grandTotal),
    };
  }
}
