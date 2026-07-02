export enum DocumentType {
  SALES_INVOICE = 'sales_invoice',
  PURCHASE_ORDER = 'purchase_order',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
  DELIVERY_ORDER = 'delivery_order',
  STOCK_TRANSFER = 'stock_transfer',
  CASH_MOVEMENT = 'cash_movement',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  DELIVERED = 'delivered',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum CounterDocumentType {
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
}

export interface DocumentLineData {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate?: number;
  productId?: string;
  warehouseId?: string;
}

export interface CreateDocumentData {
  documentType: DocumentType;
  currency?: string;
  notes?: string;
  lines: DocumentLineData[];
}

export interface Document {
  id: string;
  tenantId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  documentNumber: string;
  originalDocumentId?: string | null;
  counterDocumentType?: CounterDocumentType | null;
  currency: string;
  exchangeRate?: number | null;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes?: string | null;
  rejectionReason?: string | null;
  createdById: string;
  approvedById?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  lines?: DocumentLine[];
}

export interface DocumentLine {
  id: string;
  documentId: string;
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
  warehouseId?: string | null;
  createdAt: Date;
}

export function calculateLineTotals(line: {
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate?: number;
}): { subtotal: number; taxAmount: number; discountAmount: number; lineTotal: number } {
  const rawSubtotal = line.quantity * line.unitPrice;
  const discountRate = line.discountRate || 0;
  const discountAmount = rawSubtotal * (discountRate / 100);
  const afterDiscount = rawSubtotal - discountAmount;
  const taxAmount = afterDiscount * (line.taxRate / 100);
  const lineTotal = afterDiscount + taxAmount;
  return {
    subtotal: Math.round(rawSubtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    lineTotal: Math.round(lineTotal * 100) / 100,
  };
}

export function calculateDocumentTotals(lines: Array<{ subtotal: number; taxAmount: number; discountAmount: number; lineTotal: number }>): {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;
  let grandTotal = 0;
  for (const line of lines) {
    subtotal += line.subtotal;
    taxTotal += line.taxAmount;
    discountTotal += line.discountAmount;
    grandTotal += line.lineTotal;
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}
