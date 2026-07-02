import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { REPORTS_REPOSITORY } from '../domain/report.repository.interface';
import { PrismaReportsRepository } from './prisma-reports.repository';
import { DashboardService } from '../application/dashboard.service';
import { ReportExportService } from '../application/report-export.service';
import { ReportDefinitionService } from '../application/report-definition.service';
import { ReportSchedulerService } from '../application/report-scheduler.service';
import { ReportCleanupService } from '../application/report-cleanup.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { CsvGeneratorService } from './csv-generator.service';
import { MinioStorageService } from './minio-storage.service';
import { ReportExportProcessor } from '../jobs/report-export.processor';
import { ReportCleanupProcessor } from '../jobs/report-cleanup.processor';
import { ReportScheduleProcessor } from '../jobs/report-schedule.processor';
import { ReportGateway } from './report-gateway';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'report-export' },
      { name: 'report-cleanup' },
      { name: 'report-schedule' },
    ),
  ],
  controllers: [ReportsController],
  providers: [
    { provide: REPORTS_REPOSITORY, useClass: PrismaReportsRepository },
    PrismaReportsRepository,
    DashboardService,
    ReportExportService,
    ReportDefinitionService,
    ReportSchedulerService,
    ReportCleanupService,
    PdfGeneratorService,
    ExcelGeneratorService,
    CsvGeneratorService,
    MinioStorageService,
    ReportExportProcessor,
    ReportCleanupProcessor,
    ReportScheduleProcessor,
    ReportGateway,
  ],
})
export class ReportsModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsModule.name);

  constructor(
    private readonly schedulerService: ReportSchedulerService,
    @InjectQueue('report-cleanup') private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.schedulerService.loadAndRegisterAllEnabled();
      await this.cleanupQueue.add('cleanup', {}, {
        repeat: { pattern: '0 3 * * *' },
        jobId: 'cleanup:daily',
      });
      this.logger.log('Registered daily cleanup job at 3:00 AM');
    } catch (err) {
      this.logger.warn('Module init partially failed', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.schedulerService.cancelAll();
    } catch (err) {
      this.logger.warn('Error during module destroy', err);
    }
    try {
      await this.cleanupQueue.close();
    } catch (err) {
      this.logger.warn('Error closing cleanup queue', err);
    }
  }
}
