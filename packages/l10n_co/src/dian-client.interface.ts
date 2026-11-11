import type { FiscalRegistryResult } from '@atrio/core-accounting';

export interface DianClient {
  sendInvoice(xml: string): Promise<DianResponse>;
  getStatus(cufe: string): Promise<DianStatusResponse>;
}

export interface DianResponse {
  accepted: boolean;
  cufe: string;
  qrUrl: string;
  dianMessage: string;
  error?: string;
  rawXml?: string;
}

export interface DianStatusResponse {
  status: 'accepted' | 'rejected' | 'pending';
  cufe: string;
}

export interface DianInvoiceXmlBuilder {
  buildXml(invoice: DianInvoiceData): string;
}

export interface DianInvoiceData {
  documentNumber: string;
  clientName: string;
  clientTaxId: string;
  clientAddress?: string;
  lines: DianLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  createdAt: Date;
}

export interface DianLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}
