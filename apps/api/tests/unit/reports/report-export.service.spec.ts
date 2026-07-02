import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportExportService } from '../../../src/modules/reports/application/report-export.service';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('ReportExportService', () => {
  let service: ReportExportService;

  const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
  const mockRepo = {};
  const mockPrisma = { reportExecution: { findFirst: jest.fn() } };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportExportService,
        { provide: getQueueToken('report-export'), useValue: mockQueue },
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ReportExportService>(ReportExportService);
  });

  it('should request export and return taskId', async () => {
    const result = await service.requestExport('t-1', 'u-1', 'SALES', 'PDF');
    expect(result).toHaveProperty('taskId');
    expect(result.status).toBe('pending');
  });
});
