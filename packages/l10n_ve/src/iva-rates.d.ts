export declare const IVA_RATES: {
    readonly GENERAL: 0.16;
    readonly REDUCED: 0.08;
    readonly LUXURY_ADDITIONAL: 0.15;
    readonly EXEMPT: 0;
};
export type IvaCategory = 'general' | 'reduced' | 'luxury' | 'exempt';
export declare function getIvaRate(category: IvaCategory): number;
export declare function getIvaDescription(category: IvaCategory, rate: number): string;
