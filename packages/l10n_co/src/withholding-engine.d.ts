import type { TaxDetailLine } from "@atrio/core-accounting";
export interface WithholdingConfig {
    reteIvaRate: number;
    reteFuenteRate: number;
    reteIcaRate: number;
}
export declare const DEFAULT_WITHHOLDING_CONFIG: WithholdingConfig;
export declare function calculateReteIva(ivaAmount: number, rate?: number): TaxDetailLine;
export declare function calculateReteFuente(baseImponible: number, rate?: number): TaxDetailLine;
export declare function calculateReteIca(baseImponible: number, rate?: number): TaxDetailLine;
