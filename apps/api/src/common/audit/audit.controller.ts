import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';

@ApiTags('Audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('audit:read')
  @ApiOperation({ summary: 'List audit logs (filterable)' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit || '50', 10),
        skip: parseInt(offset || '0', 10),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }

  @Get(':id')
  @RequirePermission('audit:read')
  @ApiOperation({ summary: 'Get audit log by ID' })
  async findOne(@Param('id') id: string) {
    return this.prisma.auditLog.findUniqueOrThrow({ where: { id } });
  }
}
