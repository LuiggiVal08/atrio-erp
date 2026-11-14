"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVA_RATES = void 0;
exports.getIvaRate = getIvaRate;
exports.getIvaDescription = getIvaDescription;
exports.IVA_RATES = {
    GENERAL: 0.19,
    DIFFERENTIAL: 0.05,
    EXEMPT: 0.0,
    EXCLUDED: 0.0,
};
function getIvaRate(category) {
    switch (category) {
        case 'general': return exports.IVA_RATES.GENERAL;
        case 'differential': return exports.IVA_RATES.DIFFERENTIAL;
        case 'exempt': return exports.IVA_RATES.EXEMPT;
        case 'excluded': return exports.IVA_RATES.EXCLUDED;
    }
}
function getIvaDescription(category) {
    switch (category) {
        case 'general': return 'IVA General 19%';
        case 'differential': return 'IVA Diferencial 5%';
        case 'exempt': return 'Exento (0%)';
        case 'excluded': return 'Excluido';
    }
}
//# sourceMappingURL=iva-rates.js.map