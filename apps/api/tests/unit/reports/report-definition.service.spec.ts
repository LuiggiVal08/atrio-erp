import { Test, TestingModule } from '@nestjs/testing';
import { ReportDefinitionService } from '../../../src/modules/reports/application/report-definition.service';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';

describe('ReportDefinitionService', () => {
  let service: ReportDefinitionService;

  const mockRepo = {
    findDefinitions: jest.fn().mockResolvedValue([]),
    findDefinitionById: jest.fn().mockResolvedValue(null),
    createDefinition: jest.fn().mockImplementation((d) => ({ id: 'def-1', ...d })),
    updateDefinition: jest.fn().mockImplementation((id, d) => ({ id, ...d })),
    deleteDefinition: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportDefinitionService,
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ReportDefinitionService>(ReportDefinitionService);
  });

  it('should list definitions', async () => {
    const result = await service.list('t-1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should create a definition', async () => {
    const result = await service.create({ tenantId: 't-1', name: 'Test', type: 'SALES', createdById: 'u-1' });
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test');
  });

  it('should throw on get for non-existent definition', async () => {
    await expect(service.getById('nonexistent')).rejects.toThrow();
  });
});
