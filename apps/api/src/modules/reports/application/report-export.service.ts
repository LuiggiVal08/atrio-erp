import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';

@Injectable()
export class ReportExportService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
    @InjectQueue('report-export')
    private readonly exportQueue: Queue,
  ) {}

  async requestExport(
    tenantId: string,
    requestedById: string,
    reportType: string,
    format: string,
    dateFrom?: string,
    dateTo?: string,
    filters?: Record<string, any>,
  ): Promise<{ taskId: string; status: string; warning?: string }> {
    const jobId = crypto.randomUUID();

    let warning: string | undefined;
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        warning = 'Date range exceeds 1 year. The report may take longer to generate.';
      }
    }

    const job = await this.exportQueue.add(
      'export',
      { tenantId, requestedById, reportType, format, dateFrom, dateTo, filters, jobId },
      { jobId },
    );

    return { taskId: job.id ?? jobId, status: 'pending', ...(warning ? { warning } : {}) };
  }

  async getExportStatus(taskId: string): Promise<Record<string, any>> {
    const job = await this.exportQueue.getJob(taskId);
    if (!job) {
      const execution = await this.prisma.reportExecution.findFirst({ where: { taskId } });
      if (!execution) return { status: 'not_found' };
      const state = execution.status.toLowerCase();
      if (execution.minioBucket && execution.minioKey) {
        return {
          status: state,
          downloadUrl: `/api/v1/reports/history/${execution.id}/download`,
          fileSize: execution.fileSize,
          expiresAt: execution.completedAt,
        };
      }
      return { status: state, errorMessage: execution.errorMessage };
    }

    const state = await job.getState();
    return { status: state };
  }
}
