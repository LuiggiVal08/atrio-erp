"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_WITHHOLDING_CONFIG = void 0;
exports.calculateReteIva = calculateReteIva;
exports.calculateReteFuente = calculateReteFuente;
exports.calculateReteIca = calculateReteIca;
exports.DEFAULT_WITHHOLDING_CONFIG = {
    reteIvaRate: 0.15,
    reteFuenteRate: 0.025,
    reteIcaRate: 0.0066,
};
function calculateReteIva(ivaAmount, rate = exports.DEFAULT_WITHHOLDING_CONFIG.reteIvaRate) {
    const amount = ivaAmount * rate;
    return {
        taxType: 'RETE_IVA',
        baseImponible: ivaAmount,
        percentage: rate * 100,
        amount,
        isWithholding: true,
    };
}
function calculateReteFuente(baseImponible, rate = exports.DEFAULT_WITHHOLDING_CONFIG.reteFuenteRate) {
    const amount = baseImponible * rate;
    return {
        taxType: 'RETE_FUENTE',
        baseImponible,
        percentage: rate * 100,
        amount,
        isWithholding: true,
    };
}
function calculateReteIca(baseImponible, rate = exports.DEFAULT_WITHHOLDING_CONFIG.reteIcaRate) {
    const amount = baseImponible * rate;
    return {
        taxType: 'RETE_ICA',
        baseImponible,
        percentage: rate * 100,
        amount,
        isWithholding: true,
    };
}
//# sourceMappingURL=withholding-engine.js.map