import { Injectable, Inject, Logger } from '@nestjs/common';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';
import { MinioStorageService } from '../infrastructure/minio-storage.service';

@Injectable()
export class ReportCleanupService {
  private readonly logger = new Logger(ReportCleanupService.name);

  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
    private readonly minio: MinioStorageService,
  ) {}

  async cleanupExpired(): Promise<number> {
    const expired = await this.repo.findExpiredHistory();
    this.logger.log(`Found ${expired.length} expired history entries to clean up`);

    for (const entry of expired) {
      try {
        await this.minio.delete(entry.tenantId, entry.minioKey);
      } catch (err) {
        this.logger.warn(`Failed to delete file from MinIO: ${entry.minioKey}`, err);
      }
      await this.repo.deleteHistoryEntry(entry.id);
    }

    return expired.length;
  }
}
