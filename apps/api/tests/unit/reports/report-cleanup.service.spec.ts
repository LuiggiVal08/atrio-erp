import { Test, TestingModule } from '@nestjs/testing';
import { ReportCleanupService } from '../../../src/modules/reports/application/report-cleanup.service';
import { REPORTS_REPOSITORY } from '../../../src/modules/reports/domain/report.repository.interface';
import { MinioStorageService } from '../../../src/modules/reports/infrastructure/minio-storage.service';

describe('ReportCleanupService', () => {
  let service: ReportCleanupService;

  const mockRepo = {
    findExpiredHistory: jest.fn().mockResolvedValue([
      { id: 'h-1', tenantId: 't-1', minioKey: 'exports/key1.pdf' },
      { id: 'h-2', tenantId: 't-1', minioKey: 'exports/key2.xlsx' },
    ]),
    deleteHistoryEntry: jest.fn(),
  };

  const mockMinio = {
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCleanupService,
        { provide: REPORTS_REPOSITORY, useValue: mockRepo },
        { provide: MinioStorageService, useValue: mockMinio },
      ],
    }).compile();
    service = module.get<ReportCleanupService>(ReportCleanupService);
  });

  it('should clean up expired history entries', async () => {
    const count = await service.cleanupExpired();
    expect(count).toBe(2);
    expect(mockMinio.delete).toHaveBeenCalledTimes(2);
    expect(mockRepo.deleteHistoryEntry).toHaveBeenCalledTimes(2);
  });
});
