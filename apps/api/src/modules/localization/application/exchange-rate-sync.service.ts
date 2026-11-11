import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { LocalizationRepository } from '../domain/localization.repository.interface';
import { ExchangeRateProvider } from './exchange-rate-provider.interface';
import { FrankfurterProvider } from './frankfurter-provider';
import { OpenErApiProvider } from './open-er-api-provider';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ConfigurableExchangeRateProvider } from './configurable-exchange-rate-provider';

export interface ExchangeRateSyncResult {
  provider: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
}

@Injectable()
export class ExchangeRateSyncService {
  private readonly providers: ExchangeRateProvider[];

  constructor(
    @Inject('LocalizationRepository') private readonly repo: LocalizationRepository,
    openErApiProvider: OpenErApiProvider,
    frankfurterProvider: FrankfurterProvider,
    private readonly prisma: PrismaService,
  ) {
    this.providers = [openErApiProvider, frankfurterProvider];
  }

  async sync(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
    providerIds?: string[],
  ): Promise<ExchangeRateSyncResult> {
    const from = fromCurrency?.trim().toUpperCase();
    const to = toCurrency?.trim().toUpperCase();
    if (!from || !to) {
      throw new BadRequestException('Debe indicar las monedas de origen y destino');
    }
    if (from === to) {
      throw new BadRequestException('Las monedas de origen y destino deben ser diferentes');
    }

    let selectedIds = providerIds?.length ? providerIds : undefined;
    let customProviders: ExchangeRateProvider[] = [];
    if (!selectedIds) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settings = tenant?.settings && typeof tenant.settings === 'object'
        ? tenant.settings as Record<string, unknown>
        : {};
      customProviders = this.readCustomProviders(settings);
      const configuredChain = settings.exchangeRateProviders;
      if (configuredChain === 'manual') {
        throw new BadRequestException('La actualización automática está desactivada; registra la tasa manualmente');
      }
      if (configuredChain === 'open-er-api') {
        selectedIds = ['open-er-api', 'frankfurter'];
      } else if (configuredChain === 'frankfurter') {
        selectedIds = ['frankfurter', 'open-er-api'];
      } else if (configuredChain === 'custom') {
        selectedIds = customProviders.filter((provider) => provider.id).map((provider) => provider.id);
      }
    }
    if (!customProviders.length) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });
      const settings = tenant?.settings && typeof tenant.settings === 'object'
        ? tenant.settings as Record<string, unknown>
        : {};
      customProviders = this.readCustomProviders(settings);
    }
    if (!selectedIds && customProviders.length) selectedIds = customProviders.map((provider) => provider.id);
    selectedIds ??= this.providers.map((provider) => provider.id);
    const providers = selectedIds
      .map((id) => [...this.providers, ...customProviders].find((provider) => provider.id === id))
      .filter((provider): provider is ExchangeRateProvider => Boolean(provider));

    if (!providers.length) {
      throw new BadRequestException('No hay proveedores de tasa configurados');
    }

    const errors: string[] = [];
    for (const provider of providers) {
      try {
        const quote = await provider.fetchQuote(from, to);
        const date = new Date(Date.UTC(
          quote.effectiveDate.getUTCFullYear(),
          quote.effectiveDate.getUTCMonth(),
          quote.effectiveDate.getUTCDate(),
        ));
        await this.repo.upsertCurrencyRate({
          tenantId,
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          rate: quote.rate,
          date,
        });
        return {
          provider: provider.id,
          fromCurrency: quote.fromCurrency,
          toCurrency: quote.toCurrency,
          rate: quote.rate,
          date: date.toISOString(),
        };
      } catch (error) {
        errors.push(`${provider.id}: ${error instanceof Error ? error.message : 'error desconocido'}`);
      }
    }

    throw new ServiceUnavailableException({
      message: 'Ningún proveedor pudo actualizar la tasa',
      attempts: errors,
    });
  }

  private readCustomProviders(settings: Record<string, unknown>): ExchangeRateProvider[] {
    const config = settings.exchangeRateProviderConfig;
    if (!config || typeof config !== 'object') return [];
    const providers = (config as { providers?: unknown }).providers;
    if (!Array.isArray(providers)) return [];

    return providers
      .filter((provider): provider is Record<string, unknown> => Boolean(provider) && typeof provider === 'object')
      .filter((provider) => provider.enabled !== false)
      .flatMap((provider): ExchangeRateProvider[] => {
        const id = String(provider.id || '').trim();
        const name = String(provider.name || '').trim();
        const urlTemplate = String(provider.urlTemplate || '').trim();
        const ratePath = String(provider.ratePath || '').trim();
        if (!id || !name || !urlTemplate || !ratePath) return [];
        return [new ConfigurableExchangeRateProvider({
          id,
          name,
          urlTemplate,
          ratePath,
          datePath: provider.datePath ? String(provider.datePath) : undefined,
          apiKeyHeader: provider.apiKeyHeader ? String(provider.apiKeyHeader) : undefined,
          apiKey: provider.apiKey ? String(provider.apiKey) : undefined,
        })];
      });
  }
}
