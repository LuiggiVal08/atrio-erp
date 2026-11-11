import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { LocalizationRepository } from '../domain/localization.repository.interface';

@Injectable()
export class CurrencyRateService {
  constructor(@Inject('LocalizationRepository') private readonly repo: LocalizationRepository) {}

  async create(data: { tenantId: string; fromCurrency: string; toCurrency: string; rate: number; date: Date }) {
    const fromCurrency = data.fromCurrency.toUpperCase();
    const toCurrency = data.toCurrency.toUpperCase();
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Las monedas de origen y destino deben ser diferentes');
    }
    if (!Number.isFinite(data.rate) || data.rate <= 0) {
      throw new BadRequestException('La tasa debe ser mayor que cero');
    }
    if (Number.isNaN(data.date.getTime())) {
      throw new BadRequestException('La fecha de la tasa no es válida');
    }
    return this.repo.createCurrencyRate({ ...data, fromCurrency, toCurrency });
  }

  async findAll(tenantId: string, fromCurrency?: string, toCurrency?: string) {
    return this.repo.findRates(tenantId, fromCurrency, toCurrency);
  }

  async getRateAtDate(tenantId: string, fromCurrency: string, toCurrency: string, date: Date) {
    const rate = await this.repo.findRateAtDate(tenantId, fromCurrency, toCurrency, date);
    if (!rate) throw new NotFoundException(`No rate found for ${fromCurrency}→${toCurrency} on ${date.toISOString()}`);
    return rate;
  }
}
