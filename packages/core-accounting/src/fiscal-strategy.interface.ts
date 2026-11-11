import type {
  FiscalInvoiceData,
  TaxCalculationResult,
  WithholdingResult,
  FiscalRegistryResult,
} from './types';

export interface FiscalStrategy {
  /** Código ISO del país (VE, CO, etc.) */
  countryCode: string;

  /** Calcula todos los impuestos aplicables a la factura */
  calculateTaxes(invoice: FiscalInvoiceData): TaxCalculationResult;

  /** Calcula las retenciones aplicables */
  applyWithholdings(invoice: FiscalInvoiceData): WithholdingResult;

  /** Registra el documento fiscal ante el ente regulador */
  registerFiscalDocument(invoice: FiscalInvoiceData): Promise<FiscalRegistryResult>;

  /** Anula el documento fiscal (nota de crédito) */
  voidFiscalDocument(
    originalFiscalNumber: string,
    reason: string,
  ): Promise<FiscalRegistryResult>;
}
