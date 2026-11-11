import type { TaxType } from '../types';
export interface TaxDetail {
    id: string;
    invoiceId: string;
    taxType: TaxType;
    baseImponible: number;
    percentage: number;
    amount: number;
    isWithholding: boolean;
}
//# sourceMappingURL=tax-detail.d.ts.map