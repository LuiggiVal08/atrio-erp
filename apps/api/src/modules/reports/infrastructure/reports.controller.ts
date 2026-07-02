import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { DashboardService } from '../application/dashboard.service';
import { ReportExportService } from '../application/report-export.service';
import { ReportDefinitionService } from '../application/report-definition.service';
import { ReportSchedulerService } from '../application/report-scheduler.service';
import { PrismaReportsRepository } from './prisma-reports.repository';
import { MinioStorageService } from './minio-storage.service';
import { RequestExportDto } from './dto/request-export.dto';
import { CreateReportDefinitionDto } from './dto/create-report-definition.dto';
import { UpdateReportDefinitionDto } from './dto/update-report-definition.dto';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly exportService: ReportExportService,
    private readonly definitionService: ReportDefinitionService,
    private readonly schedulerService: ReportSchedulerService,
    private readonly repo: PrismaReportsRepository,
    private readonly minioStorageService: MinioStorageService,
  ) {}

  @Get('dashboard/summary')
  @RequirePermission('reports:dashboard:view')
  @ApiOperation({ summary: 'Dashboard KPIs' })
  async getSummary(@Req() req: any) {
    return this.dashboardService.getSummary(req.user.tenantId);
  }

  @Get('dashboard/sales-trend')
  @RequirePermission('reports:dashboard:view')
  @ApiOperation({ summary: 'Sales trend' })
  async getSalesTrend(@Req() req: any, @Query() query: ReportQueryDto) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(Date.now() - 30 * 86400000);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();
    return this.dashboardService.getSalesTrend(req.user.tenantId, dateFrom, dateTo);
  }

  @Get('dashboard/top-products')
  @RequirePermission('reports:dashboard:view')
  @ApiOperation({ summary: 'Top N products' })
  async getTopProducts(@Req() req: any, @Query('limit') limit?: string) {
    return this.dashboardService.getTopProducts(req.user.tenantId, parseInt(limit ?? '10', 10));
  }

  @Get('dashboard/low-stock')
  @RequirePermission('reports:dashboard:view')
  @ApiOperation({ summary: 'Low stock products' })
  async getLowStock(@Req() req: any) {
    return this.dashboardService.getLowStock(req.user.tenantId);
  }

  @Get('widgets')
  @RequirePermission('reports:dashboard:view')
  @ApiOperation({ summary: 'List widgets' })
  async listWidgets(@Req() req: any) {
    return this.repo.findWidgets(req.user.tenantId, req.user.id);
  }

  @Post('widgets')
  @RequirePermission('reports:dashboard:manage')
  @ApiOperation({ summary: 'Create widget' })
  async createWidget(@Req() req: any, @Body() dto: CreateWidgetDto) {
    return this.repo.createWidget({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      type: dto.type,
      config: dto.config,
      positionX: dto.positionX,
      positionY: dto.positionY,
      width: dto.width,
      height: dto.height,
    });
  }

  @Patch('widgets/:id')
  @RequirePermission('reports:dashboard:manage')
  @ApiOperation({ summary: 'Update widget' })
  async updateWidget(@Param('id') id: string, @Body() dto: UpdateWidgetDto) {
    return this.repo.updateWidget(id, dto as any);
  }

  @Delete('widgets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('reports:dashboard:manage')
  @ApiOperation({ summary: 'Delete widget' })
  async deleteWidget(@Param('id') id: string) {
    await this.repo.deleteWidget(id);
  }

  @Put('widgets/reorder')
  @RequirePermission('reports:dashboard:manage')
  @ApiOperation({ summary: 'Reorder widgets' })
  async reorderWidgets(@Req() req: any, @Body() order: { id: string; positionX: number; positionY: number }[]) {
    const results = [];
    for (const item of order) {
      results.push(await this.repo.updateWidget(item.id, { positionX: item.positionX, positionY: item.positionY }));
    }
    return results;
  }

  @Post('exports/request')
  @RequirePermission('reports:export:request')
  @ApiOperation({ summary: 'Request report export' })
  async requestExport(@Req() req: any, @Body() dto: RequestExportDto) {
    return this.exportService.requestExport(
      req.user.tenantId,
      req.user.id,
      dto.reportType,
      dto.format,
      dto.dateFrom,
      dto.dateTo,
      dto.filters,
    );
  }

  @Get('exports/:taskId/status')
  @RequirePermission('reports:export:view')
  @ApiOperation({ summary: 'Get export status' })
  async getExportStatus(@Param('taskId') taskId: string) {
    return this.exportService.getExportStatus(taskId);
  }

  @Get('history')
  @RequirePermission('reports:history:view')
  @ApiOperation({ summary: 'List report history' })
  async listHistory(@Req() req: any) {
    return this.repo.findHistory({ tenantId: req.user.tenantId });
  }

  @Get('history/:id/download')
  @RequirePermission('reports:history:view')
  @ApiOperation({ summary: 'Download report file' })
  async downloadHistory(@Param('id') id: string) {
    const entry = await this.repo.findHistoryById(id);
    if (!entry) return { error: 'Not found' };
    const downloadUrl = await this.minioStorageService.getSignedUrl(entry.tenantId, entry.minioKey);
    return { downloadUrl };
  }

  @Delete('history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('reports:history:delete')
  @ApiOperation({ summary: 'Delete history entry' })
  async deleteHistory(@Param('id') id: string) {
    try {
      await this.repo.deleteHistoryEntry(id);
    } catch {
      // Ignore errors for non-existent entries
    }
  }

  @Get('definitions')
  @RequirePermission('reports:definitions:view')
  @ApiOperation({ summary: 'List definitions' })
  async listDefinitions(@Req() req: any) {
    return this.definitionService.list(req.user.tenantId);
  }

  @Post('definitions')
  @RequirePermission('reports:definitions:manage')
  @ApiOperation({ summary: 'Create definition' })
  async createDefinition(@Req() req: any, @Body() dto: CreateReportDefinitionDto) {
    const def = await this.definitionService.create({
      tenantId: req.user.tenantId,
      name: dto.name,
      type: dto.type,
      createdById: req.user.id,
      format: dto.format,
      schedule: dto.schedule,
      recipients: dto.recipients,
      config: dto.config,
    });
    if (dto.schedule) {
      await this.schedulerService.registerRepeatable(def.id, dto.schedule);
    }
    return def;
  }

  @Get('definitions/:id')
  @RequirePermission('reports:definitions:view')
  @ApiOperation({ summary: 'Get definition' })
  async getDefinition(@Param('id') id: string) {
    return this.definitionService.getById(id);
  }

  @Patch('definitions/:id')
  @RequirePermission('reports:definitions:manage')
  @ApiOperation({ summary: 'Update definition' })
  async updateDefinition(@Param('id') id: string, @Body() dto: UpdateReportDefinitionDto) {
    return this.definitionService.update(id, dto as any);
  }

  @Delete('definitions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('reports:definitions:manage')
  @ApiOperation({ summary: 'Delete definition' })
  async deleteDefinition(@Param('id') id: string) {
    await this.schedulerService.cancelRepeatable(id);
    await this.definitionService.delete(id);
  }

  @Post('definitions/:id/execute')
  @RequirePermission('reports:definitions:execute')
  @ApiOperation({ summary: 'Execute definition now' })
  async executeDefinition(@Req() req: any, @Param('id') id: string) {
    const def = await this.definitionService.getById(id);
    return this.exportService.requestExport(
      req.user.tenantId,
      req.user.id,
      def.type,
      def.format,
      undefined,
      undefined,
      def.config as Record<string, any> | undefined,
    );
  }

  @Get('definitions/:id/executions')
  @RequirePermission('reports:definitions:view')
  @ApiOperation({ summary: 'List executions for definition' })
  async listExecutions(@Req() req: any, @Param('id') id: string) {
    return this.repo.findExecutions({ tenantId: req.user.tenantId, reportDefinitionId: id });
  }
}
