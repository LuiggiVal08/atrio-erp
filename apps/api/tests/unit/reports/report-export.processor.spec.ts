import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportExportProcessor } from '../../../src/modules/reports/jobs/report-export.processor';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { PdfGeneratorService } from '../../../src/modules/reports/infrastructure/pdf-generator.service';
import { ExcelGeneratorService } from '../../../src/modules/reports/infrastructure/excel-generator.service';
import { CsvGeneratorService } from '../../../src/modules/reports/infrastructure/csv-generator.service';
import { MinioStorageService } from '../../../src/modules/reports/infrastructure/minio-storage.service';
import { MainGateway } from '../../../src/infrastructure/websocket/main.gateway';

describe('ReportExportProcessor', () => {
  let processor: ReportExportProcessor;

  const mockRepo = { createExecution: jest.fn().mockResolvedValue({ id: 'exec-1' }), updateExecution: jest.fn() };
  const mockPrisma = { $queryRaw: jest.fn().mockResolvedValue([]) };
  const mockPdf = { generate: jest.fn().mockResolvedValue(Buffer.from('pdf')) };
  const mockExcel = { generate: jest.fn().mockResolvedValue(Buffer.from('xlsx')) };
  const mockCsv = { generate: jest.fn().mockResolvedValue(Buffer.from('csv')) };
  const mockMinio = { upload: jest.fn().mockResolvedValue('key') };
  const mockGateway = { emitToTenant: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportExportProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
        { provide: PdfGeneratorService, useValue: mockPdf },
        { provide: ExcelGeneratorService, useValue: mockExcel },
        { provide: CsvGeneratorService, useValue: mockCsv },
        { provide: MinioStorageService, useValue: mockMinio },
        { provide: MainGateway, useValue: mockGateway },
      ],
    }).compile();
    processor = module.get<ReportExportProcessor>(ReportExportProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });
});
