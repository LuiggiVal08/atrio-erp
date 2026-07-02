import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ReportDefinition, ReportExecution, ReportHistory, DashboardWidget } from '@prisma/client';
import { IReportsRepository, ReportDefinitionFilter, ReportExecutionFilter, ReportHistoryFilter } from '../domain/report.repository.interface';

@Injectable()
export class PrismaReportsRepository implements IReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefinitions(filter: ReportDefinitionFilter): Promise<ReportDefinition[]> {
    return this.prisma.reportDefinition.findMany({ where: { ...(filter.tenantId ? { tenantId: filter.tenantId } : {}), ...(filter.type ? { type: filter.type as any } : {}), ...(filter.enabled !== undefined ? { enabled: filter.enabled } : {}) }, orderBy: { createdAt: 'desc' } });
  }

  async findDefinitionById(id: string): Promise<ReportDefinition | null> {
    return this.prisma.reportDefinition.findUnique({ where: { id } });
  }

  async createDefinition(data: any): Promise<ReportDefinition> {
    return this.prisma.reportDefinition.create({ data });
  }

  async updateDefinition(id: string, data: any): Promise<ReportDefinition> {
    return this.prisma.reportDefinition.update({ where: { id }, data });
  }

  async deleteDefinition(id: string): Promise<void> {
    await this.prisma.reportDefinition.deleteMany({ where: { id } });
  }

  async findExecutions(filter: ReportExecutionFilter): Promise<ReportExecution[]> {
    return this.prisma.reportExecution.findMany({ where: { tenantId: filter.tenantId, ...(filter.reportDefinitionId ? { reportDefinitionId: filter.reportDefinitionId } : {}), ...(filter.status ? { status: filter.status as any } : {}) }, orderBy: { createdAt: 'desc' } });
  }

  async findExecutionById(id: string): Promise<ReportExecution | null> {
    return this.prisma.reportExecution.findUnique({ where: { id } });
  }

  async createExecution(data: any): Promise<ReportExecution> {
    return this.prisma.reportExecution.create({ data });
  }

  async updateExecution(id: string, data: any): Promise<ReportExecution> {
    return this.prisma.reportExecution.update({ where: { id }, data });
  }

  async findHistory(filter: ReportHistoryFilter): Promise<ReportHistory[]> {
    return this.prisma.reportHistory.findMany({ where: { tenantId: filter.tenantId, ...(filter.reportType ? { reportType: filter.reportType as any } : {}) }, orderBy: { createdAt: 'desc' } });
  }

  async findHistoryById(id: string): Promise<ReportHistory | null> {
    return this.prisma.reportHistory.findUnique({ where: { id } });
  }

  async createHistoryEntry(data: any): Promise<ReportHistory> {
    return this.prisma.reportHistory.create({ data });
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    await this.prisma.reportHistory.deleteMany({ where: { id } });
  }

  async findExpiredHistory(): Promise<ReportHistory[]> {
    return this.prisma.reportHistory.findMany({ where: { expiresAt: { lt: new Date() } } });
  }

  async findWidgets(tenantId: string, userId: string): Promise<DashboardWidget[]> {
    return this.prisma.dashboardWidget.findMany({ where: { tenantId, userId }, orderBy: [{ positionY: 'asc' }, { positionX: 'asc' }] });
  }

  async createWidget(data: any): Promise<DashboardWidget> {
    return this.prisma.dashboardWidget.create({ data });
  }

  async updateWidget(id: string, data: any): Promise<DashboardWidget> {
    return this.prisma.dashboardWidget.update({ where: { id }, data });
  }

  async deleteWidget(id: string): Promise<void> {
    await this.prisma.dashboardWidget.deleteMany({ where: { id } });
  }
}
