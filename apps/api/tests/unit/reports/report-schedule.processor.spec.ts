import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportScheduleProcessor } from '../../../src/modules/reports/jobs/report-schedule.processor';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('ReportScheduleProcessor', () => {
  let processor: ReportScheduleProcessor;

  const mockRepo = {
    findDefinitionById: jest.fn().mockResolvedValue({ id: 'd-1', tenantId: 't-1', createdById: 'u-1', type: 'SALES', format: 'PDF', enabled: true, config: {} }),
    createExecution: jest.fn().mockResolvedValue({ id: 'exec-1' }),
  };

  const mockExportQueue = { add: jest.fn().mockResolvedValue({}) };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportScheduleProcessor,
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
        { provide: getQueueToken('report-export'), useValue: mockExportQueue },
      ],
    }).compile();
    processor = module.get<ReportScheduleProcessor>(ReportScheduleProcessor);
  });

  it('should process a scheduled report', async () => {
    mockRepo.findDefinitionById.mockResolvedValue({ id: 'd-1', tenantId: 't-1', createdById: 'u-1', type: 'SALES', format: 'PDF', enabled: true, config: {} });
    await processor.process({ data: { definitionId: 'd-1' } } as any);
    expect(mockRepo.createExecution).toHaveBeenCalled();
    expect(mockExportQueue.add).toHaveBeenCalled();
  });

  it('should skip if definition is disabled', async () => {
    mockRepo.findDefinitionById.mockResolvedValue({ id: 'd-2', enabled: false } as any);
    mockRepo.createExecution.mockClear();
    await processor.process({ data: { definitionId: 'd-2' } } as any);
    expect(mockRepo.createExecution).not.toHaveBeenCalled();
  });
});
