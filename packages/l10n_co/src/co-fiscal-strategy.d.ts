import type { FiscalStrategy, FiscalInvoiceData, TaxCalculationResult, WithholdingResult, FiscalRegistryResult } from "@atrio/core-accounting";
import type { DianClient, DianInvoiceXmlBuilder } from './dian-client.interface';
export declare class CoFiscalStrategy implements FiscalStrategy {
    readonly countryCode = "CO";
    private dianClient?;
    private xmlBuilder?;
    setDianClient(client: DianClient): void;
    setXmlBuilder(builder: DianInvoiceXmlBuilder): void;
    calculateTaxes(invoice: FiscalInvoiceData): TaxCalculationResult;
    applyWithholdings(invoice: FiscalInvoiceData): WithholdingResult;
    registerFiscalDocument(invoice: FiscalInvoiceData): Promise<FiscalRegistryResult>;
    voidFiscalDocument(originalFiscalNumber: string, reason: string): Promise<FiscalRegistryResult>;
}
