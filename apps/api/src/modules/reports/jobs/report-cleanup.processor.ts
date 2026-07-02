import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ReportCleanupService } from '../application/report-cleanup.service';

@Processor('report-cleanup')
@Injectable()
export class ReportCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportCleanupProcessor.name);

  constructor(
    private readonly cleanupService: ReportCleanupService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    this.logger.log('Running cleanup job');
    const count = await this.cleanupService.cleanupExpired();
    this.logger.log(`Cleanup completed: ${count} entries removed`);
  }
}
