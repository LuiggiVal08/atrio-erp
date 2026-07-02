import { Test, TestingModule } from '@nestjs/testing';
import { ExcelGeneratorService } from '../../../src/modules/reports/infrastructure/excel-generator.service';

describe('ExcelGeneratorService', () => {
  let service: ExcelGeneratorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelGeneratorService],
    }).compile();
    service = module.get<ExcelGeneratorService>(ExcelGeneratorService);
  });

  it('should generate an XLSX buffer', async () => {
    const buffer = await service.generate('test', {
      headers: ['Name', 'Value'],
      rows: [{ Name: 'Test', Value: 100 }],
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
