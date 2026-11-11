export type InvoiceStatus = 'draft' | 'pending_fiscal' | 'posted' | 'voided';
export type TaxType = 'IVA_DEBIT' | 'RETE_IVA' | 'RETE_FUENTE' | 'RETE_ICA' | 'IGTF';
export type ContributorType = 'formal' | 'ordinary' | 'special';
export interface InvoiceLine {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountRate?: number;
    lineTotal?: number;
}
export interface TaxCalculationResult {
    lines: TaxDetailLine[];
    totalTax: number;
    totalWithholdings: number;
    netReceivable: number;
}
export interface TaxDetailLine {
    taxType: TaxType;
    baseImponible: number;
    percentage: number;
    amount: number;
    isWithholding: boolean;
}
export interface WithholdingResult {
    withholdings: TaxDetailLine[];
    totalWithholding: number;
}
export interface FiscalRegistryResult {
    success: boolean;
    fiscalNumber?: string;
    cufe?: string;
    qrUrl?: string;
    error?: string;
    rawResponse?: Record<string, unknown>;
}
export interface FiscalInvoiceData {
    id: string;
    documentNumber: string;
    clientId: string;
    clientName: string;
    clientTaxId: string;
    clientContributorType?: ContributorType;
    lines: InvoiceLine[];
    subtotal: number;
    currency: string;
    exchangeRate?: number;
    countryCode: string;
    createdAt: Date;
}
//# sourceMappingURL=types.d.ts.map