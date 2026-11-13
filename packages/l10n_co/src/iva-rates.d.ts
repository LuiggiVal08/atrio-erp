export declare const IVA_RATES: {
    readonly GENERAL: 0.19;
    readonly DIFFERENTIAL: 0.05;
    readonly EXEMPT: 0;
    readonly EXCLUDED: 0;
};
export type IvaCategory = 'general' | 'differential' | 'exempt' | 'excluded';
export declare function getIvaRate(category: IvaCategory): number;
export declare function getIvaDescription(category: IvaCategory): string;
