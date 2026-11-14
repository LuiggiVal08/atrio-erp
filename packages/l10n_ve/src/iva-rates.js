"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVA_RATES = void 0;
exports.getIvaRate = getIvaRate;
exports.getIvaDescription = getIvaDescription;
exports.IVA_RATES = {
    GENERAL: 0.16,
    REDUCED: 0.08,
    LUXURY_ADDITIONAL: 0.15,
    EXEMPT: 0,
};
function getIvaRate(category) {
    switch (category) {
        case 'general': return exports.IVA_RATES.GENERAL;
        case 'reduced': return exports.IVA_RATES.REDUCED;
        case 'luxury': return exports.IVA_RATES.GENERAL + exports.IVA_RATES.LUXURY_ADDITIONAL;
        case 'exempt': return exports.IVA_RATES.EXEMPT;
    }
}
function getIvaDescription(category, rate) {
    switch (category) {
        case 'general': return `IVA General ${(rate * 100).toFixed(0)}%`;
        case 'reduced': return `IVA Reducido ${(rate * 100).toFixed(0)}%`;
        case 'luxury': return `IVA Suntuario ${(rate * 100).toFixed(0)}%`;
        case 'exempt': return 'Exento de IVA';
    }
}
//# sourceMappingURL=iva-rates.js.map