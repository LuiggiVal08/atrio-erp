import type { InvoiceStatus } from '../types';
export interface Invoice {
    id: string;
    tenantId: string;
    documentId: string;
    documentNumber: string;
    clientId: string;
    status: InvoiceStatus;
    subtotal: number;
    taxAmount: number;
    total: number;
    currency: string;
    exchangeRate?: number;
    fiscalStatus?: string;
    fiscalNumber?: string;
    cufe?: string;
    qrUrl?: string;
    dianXml?: string;
    fiscalError?: string;
    fiscalSentAt?: Date;
    fiscalPostedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
