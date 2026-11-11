import { LocalizationTaxService } from '../../../src/modules/localization/application/localization-tax.service';
import { LocalizationRepository } from '../../../src/modules/localization/domain/localization.repository.interface';

describe('LocalizationTaxService', () => {
  let service: LocalizationTaxService;
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
    service = new LocalizationTaxService(mockRepo);
    jest.clearAllMocks();
  });

  it('should create a tax', async () => {
    (mockRepo.createTax as jest.Mock).mockResolvedValue({ id: 'tax-1', name: 'IVA', rate: 16, type: 'percentage' });
    const result = await service.create({ tenantId: 't1', name: 'IVA', rate: 16, type: 'percentage' });
    expect(result).toHaveProperty('id', 'tax-1');
  });

  it('should find all taxes', async () => {
    (mockRepo.findAllTaxes as jest.Mock).mockResolvedValue([{ id: 'tax-1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });

  it('should find tax by id', async () => {
    (mockRepo.findTaxById as jest.Mock).mockResolvedValue({ id: 'tax-1' });
    const result = await service.findById('tax-1');
    expect(result).toHaveProperty('id', 'tax-1');
  });

  it('should throw when tax not found', async () => {
    (mockRepo.findTaxById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Tax not found');
  });
});
