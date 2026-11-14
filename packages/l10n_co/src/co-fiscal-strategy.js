"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoFiscalStrategy = void 0;
const withholding_engine_1 = require("./withholding-engine");
class CoFiscalStrategy {
    countryCode = 'CO';
    dianClient;
    xmlBuilder;
    setDianClient(client) {
        this.dianClient = client;
    }
    setXmlBuilder(builder) {
        this.xmlBuilder = builder;
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
        const totalTax = invoice.lines.reduce((sum, l) => {
            const base = l.quantity * l.unitPrice;
            const discount = l.discountRate ? base * (l.discountRate / 100) : 0;
            return sum + (base - discount) * l.taxRate;
        }, 0);
        const totalBase = invoice.lines.reduce((sum, l) => {
            const base = l.quantity * l.unitPrice;
            const discount = l.discountRate ? base * (l.discountRate / 100) : 0;
            return sum + (base - discount);
        }, 0);
        if (totalTax > 0) {
            withholdings.push((0, withholding_engine_1.calculateReteIva)(totalTax));
        }
        withholdings.push((0, withholding_engine_1.calculateReteFuente)(totalBase));
        withholdings.push((0, withholding_engine_1.calculateReteIca)(totalBase));
        const totalWithholding = withholdings.reduce((s, w) => s + w.amount, 0);
        return { withholdings, totalWithholding };
    }
    async registerFiscalDocument(invoice) {
        if (!this.dianClient || !this.xmlBuilder) {
            return {
                success: false,
                error: 'Cliente DIAN o generador XML no configurado',
            };
        }
        try {
            const xml = this.xmlBuilder.buildXml({
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
                currency: invoice.currency,
                createdAt: invoice.createdAt,
            });
            const dianResponse = await this.dianClient.sendInvoice(xml);
            if (dianResponse.accepted) {
                return {
                    success: true,
                    fiscalNumber: invoice.documentNumber,
                    cufe: dianResponse.cufe,
                    qrUrl: dianResponse.qrUrl,
                    rawResponse: { dianMessage: dianResponse.dianMessage },
                };
            }
            return {
                success: false,
                error: dianResponse.error ?? 'Factura rechazada por la DIAN',
                rawResponse: { dianMessage: dianResponse.dianMessage },
            };
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Error de conexión con la DIAN',
            };
        }
    }
    async voidFiscalDocument(originalFiscalNumber, reason) {
        return {
            success: true,
            rawResponse: {
                voided: true,
                originalFiscalNumber,
                reason,
                note: 'Colombia: usar nota de crédito electrónica para anular',
            },
        };
    }
}
exports.CoFiscalStrategy = CoFiscalStrategy;
//# sourceMappingURL=co-fiscal-strategy.js.map