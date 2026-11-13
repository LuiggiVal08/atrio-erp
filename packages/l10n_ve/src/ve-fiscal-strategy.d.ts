import type { FiscalStrategy, FiscalInvoiceData, TaxCalculationResult, WithholdingResult, FiscalRegistryResult } from "@atrio/core-accounting";
import type { FiscalAgent } from './fiscal-agent.interface';
export declare class VeFiscalStrategy implements FiscalStrategy {
    readonly countryCode = "VE";
    private fiscalAgent?;
    setFiscalAgent(agent: FiscalAgent): void;
    calculateTaxes(invoice: FiscalInvoiceData): TaxCalculationResult;
    applyWithholdings(invoice: FiscalInvoiceData): WithholdingResult;
    registerFiscalDocument(invoice: FiscalInvoiceData): Promise<FiscalRegistryResult>;
    voidFiscalDocument(originalFiscalNumber: string, reason: string): Promise<FiscalRegistryResult>;
}
