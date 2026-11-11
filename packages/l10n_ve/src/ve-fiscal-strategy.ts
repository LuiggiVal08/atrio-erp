import type {
  FiscalStrategy,
  FiscalInvoiceData,
  TaxCalculationResult,
  WithholdingResult,
  FiscalRegistryResult,
  TaxDetailLine,
  ContributorType,
} from '@atrio/core-accounting';
import { getIvaRate, type IvaCategory } from './iva-rates';
import { calculateIvaWithholding } from './withholding-engine';
import type { FiscalAgent } from './fiscal-agent.interface';

export class VeFiscalStrategy implements FiscalStrategy {
  readonly countryCode = 'VE';

  private fiscalAgent?: FiscalAgent;

  setFiscalAgent(agent: FiscalAgent): void {
    this.fiscalAgent = agent;
  }

  calculateTaxes(invoice: FiscalInvoiceData): TaxCalculationResult {
    const lines: TaxDetailLine[] = [];
    let totalTax = 0;

    for (const line of invoice.lines) {
      const base = line.quantity * line.unitPrice;
      const discount = line.discountRate ? base * (line.discountRate / 100) : 0;
      const baseImponible = base - discount;
      const rate = line.taxRate;
      const ivaAmount = baseImponible * rate;

      if (ivaAmount > 0) {
        lines.push({
          taxType: 'IVA_DEBIT',
          baseImponible,
          percentage: rate * 100,
          amount: ivaAmount,
          isWithholding: false,
        });
        totalTax += ivaAmount;
      }
    }

    return {
      lines,
      totalTax,
      totalWithholdings: 0,
      netReceivable: invoice.subtotal + totalTax,
    };
  }

  applyWithholdings(invoice: FiscalInvoiceData): WithholdingResult {
    const withholdings: TaxDetailLine[] = [];

    // IGTF: 3% sobre el monto total si la moneda es divisa (USD, EUR)
    if (invoice.currency !== 'VED' && invoice.currency !== 'VES') {
      const igtfRate = 0.03;
      withholdings.push({
        taxType: 'IGTF',
        baseImponible: invoice.subtotal,
        percentage: igtfRate * 100,
        amount: invoice.subtotal * igtfRate,
        isWithholding: true,
      });
    }

    // Retención de IVA si el cliente es Contribuyente Especial
    const contributorType = invoice.clientContributorType as ContributorType | undefined;
    const totalIva = invoice.lines.reduce((sum, l) => {
      const base = l.quantity * l.unitPrice;
      const discount = l.discountRate ? base * (l.discountRate / 100) : 0;
      return sum + (base - discount) * l.taxRate;
    }, 0);

    const reteIva = calculateIvaWithholding(totalIva, contributorType);
    if (reteIva) withholdings.push(reteIva);

    const totalWithholding = withholdings.reduce((s, w) => s + w.amount, 0);

    return { withholdings, totalWithholding };
  }

  async registerFiscalDocument(invoice: FiscalInvoiceData): Promise<FiscalRegistryResult> {
    if (!this.fiscalAgent) {
      return {
        success: false,
        error: 'No hay agente fiscal configurado. La factura queda en PENDING_FISCAL.',
      };
    }

    try {
      const result = await this.fiscalAgent.printInvoice({
        documentNumber: invoice.documentNumber,
        clientName: invoice.clientName,
        clientTaxId: invoice.clientTaxId,
        lines: invoice.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          total: l.lineTotal ?? l.quantity * l.unitPrice,
        })),
        subtotal: invoice.subtotal,
        taxAmount: 0,
        total: invoice.subtotal + invoice.lines.reduce((s, l) => {
          const base = l.quantity * l.unitPrice;
          const discount = l.discountRate ? base * (l.discountRate / 100) : 0;
          return s + (base - discount) * l.taxRate;
        }, 0),
        paymentMethod: 'multiple',
      });

      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error de comunicación con el agente fiscal',
      };
    }
  }

  async voidFiscalDocument(originalFiscalNumber: string, reason: string): Promise<FiscalRegistryResult> {
    if (!this.fiscalAgent) {
      return {
        success: false,
        error: 'No hay agente fiscal para anular el documento',
      };
    }

    return {
      success: true,
      fiscalNumber: undefined,
      cufe: undefined,
      rawResponse: { voided: true, originalFiscalNumber, reason },
    };
  }
}
