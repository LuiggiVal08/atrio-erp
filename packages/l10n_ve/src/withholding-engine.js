"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETE_IVA_RATES = void 0;
exports.calculateIvaWithholding = calculateIvaWithholding;
exports.RETE_IVA_RATES = {
    special: 0.75,
    public: 1.0,
};
function calculateIvaWithholding(ivaAmount, contributorType, isPublicEntity = false) {
    if (!contributorType && !isPublicEntity)
        return null;
    const rate = isPublicEntity
        ? exports.RETE_IVA_RATES.public
        : exports.RETE_IVA_RATES[contributorType ?? ''];
    if (!rate)
        return null;
    const amount = ivaAmount * rate;
    return {
        taxType: 'RETE_IVA',
        baseImponible: ivaAmount,
        percentage: rate * 100,
        amount,
        isWithholding: true,
    };
}
//# sourceMappingURL=withholding-engine.js.map