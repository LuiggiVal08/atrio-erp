import { ReportDefinition, ReportExecution, ReportHistory, DashboardWidget } from '@prisma/client';

export const REPORTS_REPOSITORY = 'REPORTS_REPOSITORY';

export interface ReportDefinitionFilter {
  tenantId?: string;
  type?: string;
  enabled?: boolean;
}

export interface ReportExecutionFilter {
  tenantId: string;
  reportDefinitionId?: string;
  status?: string;
}

export interface ReportHistoryFilter {
  tenantId: string;
  reportType?: string;
}

export interface IReportsRepository {
  findDefinitions(filter: ReportDefinitionFilter): Promise<ReportDefinition[]>;
  findDefinitionById(id: string): Promise<ReportDefinition | null>;
  createDefinition(data: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportDefinition>;
  updateDefinition(id: string, data: Partial<Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ReportDefinition>;
  deleteDefinition(id: string): Promise<void>;

  findExecutions(filter: ReportExecutionFilter): Promise<ReportExecution[]>;
  findExecutionById(id: string): Promise<ReportExecution | null>;
  createExecution(data: Omit<ReportExecution, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<ReportExecution>;
  updateExecution(id: string, data: Partial<Omit<ReportExecution, 'id' | 'createdAt'>>): Promise<ReportExecution>;

  findHistory(filter: ReportHistoryFilter): Promise<ReportHistory[]>;
  findHistoryById(id: string): Promise<ReportHistory | null>;
  createHistoryEntry(data: Omit<ReportHistory, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<ReportHistory>;
  deleteHistoryEntry(id: string): Promise<void>;
  findExpiredHistory(): Promise<ReportHistory[]>;

  findWidgets(tenantId: string, userId: string): Promise<DashboardWidget[]>;
  createWidget(data: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DashboardWidget>;
  updateWidget(id: string, data: Partial<Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DashboardWidget>;
  deleteWidget(id: string): Promise<void>;
}
