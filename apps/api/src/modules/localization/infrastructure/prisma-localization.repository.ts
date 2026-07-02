import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { LocalizationRepository } from '../domain/localization.repository.interface';
import { LocalizationTax } from '../domain/localization-tax.entity';
import { CurrencyRate } from '../domain/currency-rate.entity';

@Injectable()
export class PrismaLocalizationRepository implements LocalizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTax(data: { tenantId: string; name: string; rate: number; type: 'percentage' | 'fixed' }): Promise<LocalizationTax> {
    const r = await this.prisma.localizationTax.create({ data });
    return new LocalizationTax(r.id, r.tenantId, r.name, r.rate, r.type as any, r.isActive, r.createdAt, r.updatedAt);
  }

  async findAllTaxes(tenantId: string): Promise<LocalizationTax[]> {
    const records = await this.prisma.localizationTax.findMany({ where: { tenantId } });
    return records.map(r => new LocalizationTax(r.id, r.tenantId, r.name, r.rate, r.type as any, r.isActive, r.createdAt, r.updatedAt));
  }

  async findTaxById(id: string): Promise<LocalizationTax | null> {
    const r = await this.prisma.localizationTax.findUnique({ where: { id } });
    if (!r) return null;
    return new LocalizationTax(r.id, r.tenantId, r.name, r.rate, r.type as any, r.isActive, r.createdAt, r.updatedAt);
  }

  async updateTax(id: string, data: any): Promise<LocalizationTax> {
    const r = await this.prisma.localizationTax.update({ where: { id }, data });
    return new LocalizationTax(r.id, r.tenantId, r.name, r.rate, r.type as any, r.isActive, r.createdAt, r.updatedAt);
  }

  async deleteTax(id: string): Promise<void> {
    await this.prisma.localizationTax.delete({ where: { id } });
  }

  async createCurrencyRate(data: { tenantId: string; fromCurrency: string; toCurrency: string; rate: number; date: Date }): Promise<CurrencyRate> {
    const r = await this.prisma.currencyRate.create({ data });
    return new CurrencyRate(r.id, r.tenantId, r.fromCurrency, r.toCurrency, r.rate, r.date, r.createdAt);
  }

  async findRates(tenantId: string, fromCurrency: string, toCurrency: string): Promise<CurrencyRate[]> {
    const records = await this.prisma.currencyRate.findMany({
      where: { tenantId, fromCurrency, toCurrency },
      orderBy: { date: 'desc' },
    });
    return records.map(r => new CurrencyRate(r.id, r.tenantId, r.fromCurrency, r.toCurrency, r.rate, r.date, r.createdAt));
  }

  async findRateAtDate(tenantId: string, fromCurrency: string, toCurrency: string, date: Date): Promise<CurrencyRate | null> {
    const r = await this.prisma.currencyRate.findFirst({
      where: {
        tenantId, fromCurrency, toCurrency,
        date: { lte: date },
      },
      orderBy: { date: 'desc' },
    });
    if (!r) return null;
    return new CurrencyRate(r.id, r.tenantId, r.fromCurrency, r.toCurrency, r.rate, r.date, r.createdAt);
  }
}
