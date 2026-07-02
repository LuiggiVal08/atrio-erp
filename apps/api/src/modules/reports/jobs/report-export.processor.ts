import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';
import { PdfGeneratorService } from '../infrastructure/pdf-generator.service';
import { ExcelGeneratorService } from '../infrastructure/excel-generator.service';
import { CsvGeneratorService } from '../infrastructure/csv-generator.service';
import { MinioStorageService } from '../infrastructure/minio-storage.service';
import { MainGateway } from '@/infrastructure/websocket/main.gateway';

@Processor('report-export')
@Injectable()
export class ReportExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportExportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly excelGenerator: ExcelGeneratorService,
    private readonly csvGenerator: CsvGeneratorService,
    private readonly minio: MinioStorageService,
    private readonly gateway: MainGateway,
  ) {
    super();
  }

  async process(job: Job<{
    tenantId: string;
    requestedById: string;
    reportType: string;
    format: string;
    dateFrom?: string;
    dateTo?: string;
    filters?: Record<string, any>;
    jobId: string;
  }>): Promise<void> {
    const { tenantId, requestedById, reportType, format, jobId } = job.data;
    this.logger.log(`Processing export job ${jobId} (${reportType}/${format})`);

    this.gateway.emitToTenant(tenantId, 'report.processing', {
      taskId: jobId,
      reportType,
    });

    const execution = await this.repo.createExecution({
      id: crypto.randomUUID(),
      reportDefinitionId: '',
      tenantId,
      requestedById,
      status: 'PROCESSING',
      taskId: jobId,
      startedAt: new Date(),
      completedAt: null,
      minioBucket: null,
      minioKey: null,
      fileSize: null,
      errorMessage: null,
    });

    try {
      const headers: string[] = [];
      const rows: Record<string, any>[] = [];

      if (reportType === 'SALES') {
        const sales = await this.prisma.$queryRaw<Record<string, any>[]>`
          SELECT d.document_number as docNumber, d.created_at::date as date, c.legal_name as client, d.grand_total as total, d.status
          FROM documents d
          JOIN clients c ON c.id = d.tenant_id || '-client'
          WHERE d.tenant_id = ${tenantId}::uuid AND d.document_type = 'sales_invoice'
          ORDER BY d.created_at DESC
        `;
        headers.push('Documento', 'Fecha', 'Cliente', 'Total', 'Estado');
        rows.push(...sales.map((r) => ({
          Documento: r.docNumber, Fecha: String(r.date), Cliente: r.client,
          Total: Number(r.total), Estado: r.status,
        })));
      }

      let buffer: Buffer;
      const templateName = `${reportType.toLowerCase()}-report`;

      if (format === 'PDF') {
        buffer = await this.pdfGenerator.generate(templateName, {
          periodLabel: `${job.data.dateFrom ?? ''} - ${job.data.dateTo ?? ''}`,
          rows,
          grandTotal: rows.reduce((s, r) => s + Number(r.Total ?? 0), 0),
          generatedAt: new Date().toISOString(),
        });
      } else if (format === 'XLSX') {
        buffer = await this.excelGenerator.generate(templateName, { headers, rows });
      } else {
        buffer = await this.csvGenerator.generate(templateName, { headers, rows });
      }

      const ext = format.toLowerCase();
      const key = `exports/${tenantId}/${jobId}.${ext}`;
      await this.minio.upload(tenantId, key, buffer);

      await this.repo.updateExecution(execution.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        minioBucket: `reports-${tenantId}`,
        minioKey: key,
        fileSize: buffer.length,
      });

      const downloadUrl = `/api/v1/reports/history/${execution.id}/download`;

      this.gateway.emitToTenant(tenantId, 'report.completed', {
        taskId: jobId,
        reportType,
        downloadUrl,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Export job ${jobId} failed: ${message}`);

      await this.repo.updateExecution(execution.id, {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: message,
      });

      this.gateway.emitToTenant(tenantId, 'report.failed', {
        taskId: jobId,
        reportType,
        error: message,
      });
    }
  }
}
