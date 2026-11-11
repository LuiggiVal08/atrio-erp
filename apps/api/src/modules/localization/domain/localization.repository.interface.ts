import { LocalizationTax } from './localization-tax.entity';
import { CurrencyRate } from './currency-rate.entity';

export interface LocalizationRepository {
  createTax(data: { tenantId: string; name: string; rate: number; type: 'percentage' | 'fixed' }): Promise<LocalizationTax>;
  findAllTaxes(tenantId: string): Promise<LocalizationTax[]>;
  findTaxById(id: string): Promise<LocalizationTax | null>;
  updateTax(id: string, data: Partial<Omit<LocalizationTax, 'id' | 'tenantId' | 'createdAt'>>): Promise<LocalizationTax>;
  deleteTax(id: string): Promise<void>;

  createCurrencyRate(data: { tenantId: string; fromCurrency: string; toCurrency: string; rate: number; date: Date }): Promise<CurrencyRate>;
  upsertCurrencyRate(data: { tenantId: string; fromCurrency: string; toCurrency: string; rate: number; date: Date }): Promise<CurrencyRate>;
  findRates(tenantId: string, fromCurrency?: string, toCurrency?: string, date?: Date): Promise<CurrencyRate[]>;
  findRateAtDate(tenantId: string, fromCurrency: string, toCurrency: string, date: Date): Promise<CurrencyRate | null>;
}
