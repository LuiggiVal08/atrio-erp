import { Injectable } from '@nestjs/common';
import { MainGateway } from '@/infrastructure/websocket/main.gateway';

@Injectable()
export class ReportGateway {
  constructor(private readonly mainGateway: MainGateway) {}

  emitReportProcessing(tenantId: string, taskId: string, reportType: string): void {
    this.mainGateway.emitToTenant(tenantId, 'report.processing', { taskId, reportType });
  }

  emitReportCompleted(tenantId: string, taskId: string, reportType: string, downloadUrl: string, expiresAt: string): void {
    this.mainGateway.emitToTenant(tenantId, 'report.completed', { taskId, reportType, downloadUrl, expiresAt });
  }

  emitReportFailed(tenantId: string, taskId: string, reportType: string, error: string): void {
    this.mainGateway.emitToTenant(tenantId, 'report.failed', { taskId, reportType, error });
  }
}
