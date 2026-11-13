import type { ContributorType, TaxDetailLine } from "@atrio/core-accounting";
export declare const RETE_IVA_RATES: Record<string, number>;
export declare function calculateIvaWithholding(ivaAmount: number, contributorType: ContributorType | string | undefined | null, isPublicEntity?: boolean): TaxDetailLine | null;
