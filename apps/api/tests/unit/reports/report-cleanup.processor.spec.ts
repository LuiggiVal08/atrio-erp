import { Test, TestingModule } from '@nestjs/testing';
import { ReportCleanupProcessor } from '../../../src/modules/reports/jobs/report-cleanup.processor';
import { ReportCleanupService } from '../../../src/modules/reports/application/report-cleanup.service';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';
import { MinioStorageService } from '../../../src/modules/reports/infrastructure/minio-storage.service';

describe('ReportCleanupProcessor', () => {
  let processor: ReportCleanupProcessor;

  const mockCleanupService = { cleanupExpired: jest.fn().mockResolvedValue(3) };
  const mockRepo = { findExpiredHistory: jest.fn().mockResolvedValue([]), deleteHistoryEntry: jest.fn() };
  const mockMinio = { delete: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCleanupProcessor,
        { provide: ReportCleanupService, useValue: mockCleanupService },
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
        { provide: MinioStorageService, useValue: mockMinio },
      ],
    }).compile();
    processor = module.get<ReportCleanupProcessor>(ReportCleanupProcessor);
  });

  it('should process cleanup job', async () => {
    await processor.process({ data: {} } as any);
    expect(mockCleanupService.cleanupExpired).toHaveBeenCalled();
  });
});
