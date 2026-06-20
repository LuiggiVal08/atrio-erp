import { PrismaService } from '@/infrastructure/database/prisma.service';
import { DocumentRepository } from '../domain/document.repository.interface';
import { DocumentEventRepository } from '../domain/document-event.repository.interface';
import { DocumentStateMachine } from '../domain/document-state-machine';
import { DocumentStatus, DocumentType, calculateLineTotals, calculateDocumentTotals } from '../domain/document.entity';
import { DocumentEventEmitter } from '../infrastructure/document-event-emitter';

export interface CreateCounterDocumentInput {
  counterDocumentType: string;
  reason?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountRate?: number;
    productId?: string;
  }>;
}

export interface CreateCounterDocumentContext {
  tenantId: string;
  userId: string;
}

const COUNTER_PREFIXES: Record<string, string> = {
  credit_note: 'CN',
  debit_note: 'DN',
};

export class CreateCounterDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly stateMachine: DocumentStateMachine,
    private readonly eventRepository: DocumentEventRepository,
    private readonly eventEmitter: DocumentEventEmitter,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    originalDocumentId: string,
    dto: CreateCounterDocumentInput,
    ctx: CreateCounterDocumentContext,
  ) {
    const original = await this.documentRepository.findById(originalDocumentId, ctx.tenantId);
    if (!original) {
      throw new Error('Original document not found');
    }
    if (original.status !== DocumentStatus.APPROVED) {
      throw new Error('Counter-documents can only reference approved documents');
    }

    const lineCalculations = dto.lines.map((line, index) => {
      const totals = calculateLineTotals({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        discountRate: line.discountRate,
      });
      return {
        lineNumber: index + 1,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        taxAmount: totals.taxAmount,
        discountRate: line.discountRate ?? null,
        discountAmount: totals.discountAmount,
        lineTotal: totals.lineTotal,
        subtotal: totals.subtotal,
        productId: line.productId ?? null,
      };
    });

    const totals = calculateDocumentTotals(lineCalculations);
    const prefix = COUNTER_PREFIXES[dto.counterDocumentType] || 'CN';
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const seq = String(await this.documentRepository.getNextSequence(prefix, ctx.tenantId)).padStart(6, '0');
    const documentNumber = `${prefix}-${y}${m}${d}-${seq}`;

    const counterDoc = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          tenantId: ctx.tenantId,
          documentType: original.documentType,
          documentNumber,
          currency: original.currency,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          discountTotal: totals.discountTotal,
          grandTotal: totals.grandTotal,
          notes: dto.reason ?? null,
          createdById: ctx.userId,
          originalDocumentId,
          counterDocumentType: dto.counterDocumentType as any,
          lines: {
            create: lineCalculations.map((l) => ({
              lineNumber: l.lineNumber,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate,
              taxAmount: l.taxAmount,
              discountRate: l.discountRate,
              discountAmount: l.discountAmount,
              lineTotal: l.lineTotal,
              productId: l.productId,
            })),
          },
        },
        include: { lines: true },
      });

      await tx.documentEvent.create({
        data: {
          tenantId: ctx.tenantId,
          documentId: doc.id,
          eventType: 'document.counter-created',
          payload: {
            originalDocumentId,
            counterDocumentId: doc.id,
            counterDocumentType: dto.counterDocumentType,
            reason: dto.reason,
          },
          createdById: ctx.userId,
        },
      });

      return doc;
    });

    this.eventEmitter.emit('document.counter-created', {
      eventType: 'document.counter-created',
      tenantId: ctx.tenantId,
      documentId: counterDoc.id,
      documentType: counterDoc.documentType,
      timestamp: new Date().toISOString(),
      triggeredBy: ctx.userId,
      metadata: {
        originalDocumentId,
        counterDocumentId: counterDoc.id,
        counterDocumentType: dto.counterDocumentType,
      },
    });

    return this.mapToEntity(counterDoc);
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
