import { BadRequestException } from '@nestjs/common';
import { ExchangeRateSyncService } from '../../../src/modules/localization/application/exchange-rate-sync.service';
import { OpenErApiProvider } from '../../../src/modules/localization/application/open-er-api-provider';
import { FrankfurterProvider } from '../../../src/modules/localization/application/frankfurter-provider';
import { LocalizationRepository } from '../../../src/modules/localization/domain/localization.repository.interface';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('ExchangeRateSyncService', () => {
  const repo: Partial<LocalizationRepository> = {
    upsertCurrencyRate: jest.fn(),
  };
  const prisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ settings: { exchangeRateProviders: 'automatic' } }),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the next provider when the first provider fails', async () => {
    const openErApi = new OpenErApiProvider();
    jest.spyOn(openErApi, 'fetchQuote').mockRejectedValue(new Error('timeout'));
    const frankfurter = new FrankfurterProvider();
    jest.spyOn(frankfurter, 'fetchQuote').mockResolvedValue({
      fromCurrency: 'USD',
      toCurrency: 'VES',
      rate: 36.5,
      effectiveDate: new Date('2026-10-31T00:00:00Z'),
    });
    (repo.upsertCurrencyRate as jest.Mock).mockResolvedValue({ id: 'rate-1' });
    const service = new ExchangeRateSyncService(
      repo as LocalizationRepository,
      openErApi,
      frankfurter,
      prisma,
    );

    const result = await service.sync('tenant-1', 'USD', 'VES', ['open-er-api', 'frankfurter']);

    expect(result.provider).toBe('frankfurter');
    expect(result.rate).toBe(36.5);
    expect(repo.upsertCurrencyRate).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      fromCurrency: 'USD',
      toCurrency: 'VES',
      rate: 36.5,
      source: 'sync',
      provider: 'frankfurter',
    }));
  });

  it('rejects identical source and target currencies', async () => {
    const service = new ExchangeRateSyncService(
      repo as LocalizationRepository,
      new OpenErApiProvider(),
      new FrankfurterProvider(),
      prisma,
    );

    await expect(service.sync('tenant-1', 'USD', 'USD')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not call external providers when manual mode is configured', async () => {
    prisma.tenant.findUnique = jest.fn().mockResolvedValue({
      settings: { exchangeRateProviders: 'manual' },
    });
    const openErApi = new OpenErApiProvider();
    const openSpy = jest.spyOn(openErApi, 'fetchQuote');
    const service = new ExchangeRateSyncService(
      repo as LocalizationRepository,
      openErApi,
      new FrankfurterProvider(),
      prisma,
    );

    await expect(service.sync('tenant-1', 'USD', 'VES')).rejects.toBeInstanceOf(BadRequestException);
    expect(openSpy).not.toHaveBeenCalled();
  });
});
