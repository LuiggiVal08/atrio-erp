import { DocumentRepository } from '../domain/document.repository.interface';
import { DocumentType, calculateLineTotals, calculateDocumentTotals } from '../domain/document.entity';

export interface CreateDocumentInput {
  documentType: DocumentType;
  currency?: string;
  notes?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountRate?: number;
    productId?: string;
  }>;
}

export interface CreateDocumentContext {
  tenantId: string;
  userId: string;
}

const DOCUMENT_TYPE_PREFIXES: Record<string, string> = {
  sales_invoice: 'INV',
  purchase_order: 'PO',
  credit_note: 'CN',
  debit_note: 'DN',
  delivery_order: 'DO',
  stock_transfer: 'ST',
  cash_movement: 'CM',
};

export class CreateDocumentUseCase {
  constructor(private readonly documentRepository: DocumentRepository) {}

  private async generateDocumentNumber(documentType: DocumentType, tenantId: string): Promise<string> {
    const prefix = DOCUMENT_TYPE_PREFIXES[documentType] || 'DOC';
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const seq = String(await this.documentRepository.getNextSequence(prefix, tenantId)).padStart(6, '0');
    return `${prefix}-${y}${m}${d}-${seq}`;
  }

  async execute(dto: CreateDocumentInput, ctx: CreateDocumentContext) {
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
    const documentNumber = await this.generateDocumentNumber(dto.documentType, ctx.tenantId);

    return this.documentRepository.create({
      tenantId: ctx.tenantId,
      documentType: dto.documentType,
      documentNumber,
      currency: dto.currency || 'VED',
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      grandTotal: totals.grandTotal,
      notes: dto.notes ?? null,
      createdById: ctx.userId,
      lines: lineCalculations,
    });
  }
}
