import { PrismaService } from '@/infrastructure/database/prisma.service';
import { DocumentRepository } from '../domain/document.repository.interface';
import { DocumentEventRepository } from '../domain/document-event.repository.interface';
import { DocumentStateMachine } from '../domain/document-state-machine';
import { DocumentStatus } from '../domain/document.entity';
import { DocumentEventEmitter } from '../infrastructure/document-event-emitter';

export interface TransitionDocumentContext {
  tenantId: string;
  userId: string;
}

export class TransitionDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly stateMachine: DocumentStateMachine,
    private readonly eventRepository: DocumentEventRepository,
    private readonly eventEmitter: DocumentEventEmitter,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    documentId: string,
    targetStatus: DocumentStatus,
    ctx: TransitionDocumentContext,
    extra?: { rejectionReason?: string },
  ) {
    const doc = await this.documentRepository.findById(documentId, ctx.tenantId);
    if (!doc) {
      throw new Error('Document not found');
    }

    this.stateMachine.transition(doc.status, targetStatus);

    const previousStatus = doc.status;
    const action = this.stateMachine.getAction(previousStatus, targetStatus);

    const [updated] = await this.prisma.$transaction([
      this.prisma.document.update({
        where: { id: documentId, tenantId: ctx.tenantId },
        data: {
          status: targetStatus,
          ...(extra?.rejectionReason ? { rejectionReason: extra.rejectionReason } : {}),
        },
      }),
      this.prisma.documentEvent.create({
        data: {
          tenantId: ctx.tenantId,
          documentId,
          eventType: `document.${action || 'status-changed'}`,
          previousStatus,
          newStatus: targetStatus,
          payload: { action, rejectionReason: extra?.rejectionReason },
          createdById: ctx.userId,
        },
      }),
    ]);

    this.eventEmitter.emit(`document.${action || 'status-changed'}`, {
      eventType: `document.${action || 'status-changed'}`,
      tenantId: ctx.tenantId,
      documentId,
      documentType: doc.documentType,
      timestamp: new Date().toISOString(),
      triggeredBy: ctx.userId,
      metadata: {
        previousStatus,
        newStatus: targetStatus,
        action,
        rejectionReason: extra?.rejectionReason,
      },
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
