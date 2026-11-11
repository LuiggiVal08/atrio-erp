import type { TaxDetailLine } from '@atrio/core-accounting';

/**
 * ReteIVA en Colombia: 15% del monto del IVA
 * ReteFuente: tarifa variable según concepto (ej: 2.5%, 4%, 6%, 11%)
 * ReteICA: tarifa según actividad municipal (ej: 0.2% - 1%)
 */
export interface WithholdingConfig {
  reteIvaRate: number;
  reteFuenteRate: number;
  reteIcaRate: number;
}

export const DEFAULT_WITHHOLDING_CONFIG: WithholdingConfig = {
  reteIvaRate: 0.15,
  reteFuenteRate: 0.025,
  reteIcaRate: 0.0066,
};

export function calculateReteIva(
  ivaAmount: number,
  rate = DEFAULT_WITHHOLDING_CONFIG.reteIvaRate,
): TaxDetailLine {
  const amount = ivaAmount * rate;
  return {
    taxType: 'RETE_IVA',
    baseImponible: ivaAmount,
    percentage: rate * 100,
    amount,
    isWithholding: true,
  };
}

export function calculateReteFuente(
  baseImponible: number,
  rate = DEFAULT_WITHHOLDING_CONFIG.reteFuenteRate,
): TaxDetailLine {
  const amount = baseImponible * rate;
  return {
    taxType: 'RETE_FUENTE',
    baseImponible,
    percentage: rate * 100,
    amount,
    isWithholding: true,
  };
}

export function calculateReteIca(
  baseImponible: number,
  rate = DEFAULT_WITHHOLDING_CONFIG.reteIcaRate,
): TaxDetailLine {
  const amount = baseImponible * rate;
  return {
    taxType: 'RETE_ICA',
    baseImponible,
    percentage: rate * 100,
    amount,
    isWithholding: true,
  };
}
