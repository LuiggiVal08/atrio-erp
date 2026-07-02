import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
    @InjectQueue('report-schedule')
    private readonly scheduleQueue: Queue,
  ) {}

  async registerRepeatable(definitionId: string, cronExpression: string): Promise<void> {
    await this.scheduleQueue.add(
      'generate',
      { definitionId },
      { repeat: { pattern: cronExpression }, jobId: `schedule:${definitionId}` },
    );
    this.logger.log(`Registered repeatable job for definition ${definitionId}: ${cronExpression}`);
  }

  async cancelRepeatable(definitionId: string): Promise<void> {
    try {
      const jobId = `schedule:${definitionId}`;
      const jobs = await this.scheduleQueue.getJobs(['repeat', 'waiting', 'delayed']);
      for (const job of jobs) {
        if (job && (job.id === jobId || job.data?.definitionId === definitionId)) {
          await job.remove().catch(() => {});
        }
      }
      this.logger.log(`Cancelled repeatable job for definition ${definitionId}`);
    } catch (err) {
      this.logger.warn(`Failed to cancel repeatable job for definition ${definitionId}`, err);
    }
  }

  async loadAndRegisterAllEnabled(tenantId?: string): Promise<void> {
    const definitions = await this.repo.findDefinitions({ ...(tenantId ? { tenantId } : {}), enabled: true });
    for (const def of definitions) {
      if (def.schedule) {
        await this.registerRepeatable(def.id, def.schedule);
      }
    }
  }

  async cancelAll(): Promise<void> {
    try {
      const jobs = await this.scheduleQueue.getJobs(['repeat', 'waiting', 'delayed']);
      for (const job of jobs) {
        if (job) await job.remove().catch(() => {});
      }
      this.logger.log('Cancelled all repeatable jobs');
    } catch (err) {
      this.logger.warn('Failed to cancel repeatable jobs', err);
    }
  }
}
