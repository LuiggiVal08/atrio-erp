import { CurrencyRateService } from '../../../src/modules/localization/application/currency-rate.service';
import { LocalizationRepository } from '../../../src/modules/localization/domain/localization.repository.interface';

describe('CurrencyRateService', () => {
  let service: CurrencyRateService;
  const mockRepo: LocalizationRepository = {
    createTax: jest.fn(),
    findAllTaxes: jest.fn(),
    findTaxById: jest.fn(),
    updateTax: jest.fn(),
    deleteTax: jest.fn(),
    createCurrencyRate: jest.fn(),
    upsertCurrencyRate: jest.fn(),
    findRates: jest.fn(),
    findRateAtDate: jest.fn(),
  };

  beforeEach(() => {
    service = new CurrencyRateService(mockRepo);
    jest.clearAllMocks();
  });

  it('should create a rate', async () => {
    (mockRepo.createCurrencyRate as jest.Mock).mockResolvedValue({ id: 'rate-1', rate: 89.5 });
    const result = await service.create({ tenantId: 't1', fromCurrency: 'USD', toCurrency: 'VES', rate: 89.5, date: new Date() });
    expect(result).toHaveProperty('id', 'rate-1');
    expect(mockRepo.createCurrencyRate).toHaveBeenCalledWith(expect.objectContaining({
      source: 'manual',
      provider: null,
    }));
  });

  it('should reject the same source and target currency', async () => {
    await expect(service.create({
      tenantId: 't1',
      fromCurrency: 'USD',
      toCurrency: 'USD',
      rate: 1,
      date: new Date(),
    })).rejects.toThrow('diferentes');
  });

  it('should reject a non-positive rate', async () => {
    await expect(service.create({
      tenantId: 't1',
      fromCurrency: 'USD',
      toCurrency: 'VES',
      rate: 0,
      date: new Date(),
    })).rejects.toThrow('mayor que cero');
  });

  it('should find rates by currency pair', async () => {
    (mockRepo.findRates as jest.Mock).mockResolvedValue([{ id: 'rate-1' }]);
    const result = await service.findAll('t1', 'USD', 'VES');
    expect(result).toHaveLength(1);
  });

  it('should get rate at date', async () => {
    const date = new Date('2026-06-20');
    (mockRepo.findRateAtDate as jest.Mock).mockResolvedValue({ id: 'rate-1', rate: 89.5, date });
    const result = await service.getRateAtDate('t1', 'USD', 'VES', date);
    expect(result).toHaveProperty('rate', 89.5);
  });

  it('should throw when no rate at date', async () => {
    (mockRepo.findRateAtDate as jest.Mock).mockResolvedValue(null);
    await expect(service.getRateAtDate('t1', 'USD', 'VES', new Date())).rejects.toThrow('No rate found');
  });
});
