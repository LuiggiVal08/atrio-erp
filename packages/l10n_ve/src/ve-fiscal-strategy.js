"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VeFiscalStrategy = void 0;
const withholding_engine_1 = require("./withholding-engine");
class VeFiscalStrategy {
    countryCode = 'VE';
    fiscalAgent;
    setFiscalAgent(agent) {
        this.fiscalAgent = agent;
    }
    calculateTaxes(invoice) {
        const lines = [];
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
    applyWithholdings(invoice) {
        const withholdings = [];
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
        const contributorType = invoice.clientContributorType;
        const totalIva = invoice.lines.reduce((sum, l) => {
            const base = l.quantity * l.unitPrice;
            const discount = l.discountRate ? base * (l.discountRate / 100) : 0;
            return sum + (base - discount) * l.taxRate;
        }, 0);
        const reteIva = (0, withholding_engine_1.calculateIvaWithholding)(totalIva, contributorType);
        if (reteIva)
            withholdings.push(reteIva);
        const totalWithholding = withholdings.reduce((s, w) => s + w.amount, 0);
        return { withholdings, totalWithholding };
    }
    async registerFiscalDocument(invoice) {
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
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Error de comunicación con el agente fiscal',
            };
        }
    }
    async voidFiscalDocument(originalFiscalNumber, reason) {
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
exports.VeFiscalStrategy = VeFiscalStrategy;
//# sourceMappingURL=ve-fiscal-strategy.js.map