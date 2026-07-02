import { Test, TestingModule } from '@nestjs/testing';
import { CsvGeneratorService } from '../../../src/modules/reports/infrastructure/csv-generator.service';

describe('CsvGeneratorService', () => {
  let service: CsvGeneratorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvGeneratorService],
    }).compile();
    service = module.get<CsvGeneratorService>(CsvGeneratorService);
  });

  it('should generate a CSV buffer with headers', async () => {
    const buffer = await service.generate('test', {
      headers: ['Name', 'Value'],
      rows: [{ Name: 'Alpha', Value: 10 }, { Name: 'Beta', Value: 20 }],
    });
    const csv = buffer.toString('utf-8');
    expect(csv).toContain('Name,Value');
    expect(csv).toContain('Alpha,10');
    expect(csv).toContain('Beta,20');
  });

  it('should escape commas in values', async () => {
    const buffer = await service.generate('test', {
      headers: ['Name', 'Value'],
      rows: [{ Name: 'Foo,Bar', Value: 30 }],
    });
    const csv = buffer.toString('utf-8');
    expect(csv).toContain('"Foo,Bar"');
  });
});
