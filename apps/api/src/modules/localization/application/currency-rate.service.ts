import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LocalizationRepository } from '../domain/localization.repository.interface';

@Injectable()
export class CurrencyRateService {
  constructor(@Inject('LocalizationRepository') private readonly repo: LocalizationRepository) {}

  async create(data: { tenantId: string; fromCurrency: string; toCurrency: string; rate: number; date: Date }) {
    return this.repo.createCurrencyRate(data);
  }

  async findAll(tenantId: string, fromCurrency: string, toCurrency: string) {
    return this.repo.findRates(tenantId, fromCurrency, toCurrency);
  }

  async getRateAtDate(tenantId: string, fromCurrency: string, toCurrency: string, date: Date) {
    const rate = await this.repo.findRateAtDate(tenantId, fromCurrency, toCurrency, date);
    if (!rate) throw new NotFoundException(`No rate found for ${fromCurrency}→${toCurrency} on ${date.toISOString()}`);
    return rate;
  }
}
