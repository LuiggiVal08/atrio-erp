import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportSchedulerService } from '../../../src/modules/reports/application/report-scheduler.service';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';

describe('ReportSchedulerService', () => {
  let service: ReportSchedulerService;

  const mockQueue = {
    add: jest.fn().mockResolvedValue({}),
    getJobs: jest.fn().mockResolvedValue([]),
  };

  const mockRepo = {
    findDefinitions: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportSchedulerService,
        { provide: getQueueToken('report-schedule'), useValue: mockQueue },
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ReportSchedulerService>(ReportSchedulerService);
  });

  it('should register a repeatable job', async () => {
    await service.registerRepeatable('def-1', '0 8 * * 1');
    expect(mockQueue.add).toHaveBeenCalled();
  });

  it('should load and register all enabled definitions', async () => {
    mockRepo.findDefinitions.mockResolvedValueOnce([
      { id: 'd1', schedule: '0 8 * * 1', enabled: true, tenantId: 't1' },
    ] as any);
    await service.loadAndRegisterAllEnabled('t1');
    expect(mockQueue.add).toHaveBeenCalled();
  });
});
