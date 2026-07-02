import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Processor('report-schedule')
@Injectable()
export class ReportScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportScheduleProcessor.name);

  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
    @InjectQueue('report-export')
    private readonly exportQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ definitionId: string }>): Promise<void> {
    const { definitionId } = job.data;
    this.logger.log(`Processing scheduled report definition ${definitionId}`);

    const definition = await this.repo.findDefinitionById(definitionId);
    if (!definition || !definition.enabled) {
      this.logger.warn(`Definition ${definitionId} not found or disabled`);
      return;
    }

    await this.repo.createExecution({
      reportDefinitionId: definitionId,
      tenantId: definition.tenantId,
      requestedById: definition.createdById,
      status: 'PENDING',
      taskId: null,
      startedAt: new Date(),
      completedAt: null,
      minioBucket: null,
      minioKey: null,
      fileSize: null,
      errorMessage: null,
    });

    await this.exportQueue.add(
      'export',
      {
        tenantId: definition.tenantId,
        requestedById: definition.createdById,
        reportType: definition.type,
        format: definition.format,
        filters: definition.config as Record<string, any> | undefined,
      },
      { jobId: `scheduled:${definitionId}:${Date.now()}` },
    );

    this.logger.log(`Scheduled export queued for definition ${definitionId}`);
  }
}
