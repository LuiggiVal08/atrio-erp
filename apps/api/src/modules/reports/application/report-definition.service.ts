import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IReportsRepository, REPORTS_REPOSITORY } from '../domain/report.repository.interface';
import { ReportDefinition } from '@prisma/client';

@Injectable()
export class ReportDefinitionService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly repo: IReportsRepository,
  ) {}

  async list(tenantId: string): Promise<ReportDefinition[]> {
    return this.repo.findDefinitions({ tenantId });
  }

  async getById(id: string): Promise<ReportDefinition> {
    const def = await this.repo.findDefinitionById(id);
    if (!def) throw new NotFoundException('Report definition not found');
    return def;
  }

  async create(data: {
    tenantId: string;
    name: string;
    type: string;
    createdById: string;
    format?: string;
    schedule?: string;
    recipients?: string[];
    config?: Record<string, any>;
  }): Promise<ReportDefinition> {
    return this.repo.createDefinition({
      tenantId: data.tenantId,
      name: data.name,
      type: data.type as any,
      config: data.config ?? null,
      format: (data.format ?? 'PDF') as any,
      schedule: data.schedule ?? null,
      recipients: data.recipients ?? [],
      enabled: true,
      createdById: data.createdById,
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    type: string;
    format: string;
    schedule: string;
    recipients: string[];
    config: Record<string, any>;
    enabled: boolean;
  }>): Promise<ReportDefinition> {
    await this.getById(id);
    return this.repo.updateDefinition(id, data as any);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    return this.repo.deleteDefinition(id);
  }
}
