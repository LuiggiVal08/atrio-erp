import { Document, DocumentLine, CreateDocumentData, DocumentStatus, DocumentType } from './document.entity';

export interface DocumentFilters {
  status?: DocumentStatus;
  documentType?: DocumentType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentRepository {
  create(data: {
    tenantId: string;
    documentType: DocumentType;
    documentNumber: string;
    currency: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    notes?: string | null;
    createdById: string;
    lines: Array<{
      lineNumber: number;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      taxAmount: number;
      discountRate?: number | null;
      discountAmount: number;
      lineTotal: number;
      productId?: string | null;
    }>;
  }): Promise<Document>;

  findById(id: string, tenantId: string): Promise<Document | null>;

  findByIdWithLines(id: string, tenantId: string): Promise<{
    document: Document;
    lines: DocumentLine[];
  } | null>;

  findAll(tenantId: string, filters: DocumentFilters): Promise<PaginatedResult<Document>>;

  updateStatus(
    id: string,
    tenantId: string,
    status: DocumentStatus,
    extra?: { approvedById?: string; approvedAt?: Date; rejectionReason?: string; expectedPreviousStatus?: DocumentStatus },
  ): Promise<Document>;

  updateCounterDocument(
    id: string,
    tenantId: string,
    originalDocumentId: string,
    counterDocumentType: string,
  ): Promise<Document>;

  softDelete(id: string, tenantId: string): Promise<Document>;

  getNextSequence(prefix: string, tenantId: string): Promise<number>;
}
