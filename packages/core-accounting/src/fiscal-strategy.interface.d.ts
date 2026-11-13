import type { FiscalInvoiceData, TaxCalculationResult, WithholdingResult, FiscalRegistryResult } from './types';
export interface FiscalStrategy {
    countryCode: string;
    calculateTaxes(invoice: FiscalInvoiceData): TaxCalculationResult;
    applyWithholdings(invoice: FiscalInvoiceData): WithholdingResult;
    registerFiscalDocument(invoice: FiscalInvoiceData): Promise<FiscalRegistryResult>;
    voidFiscalDocument(originalFiscalNumber: string, reason: string): Promise<FiscalRegistryResult>;
}
