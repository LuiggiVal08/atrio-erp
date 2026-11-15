import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ClientService } from '../application/client.service';
import { VendorService } from '../application/vendor.service';
import { CreateClientDto, UpdateClientDto, CreateVendorDto, UpdateVendorDto, PartnerListDto } from './dto/client-vendor.dto';
import { LegacyApiInterceptor } from './legacy-api.interceptor';
import { COMPATIBILITY_METRICS_REPOSITORY } from './compatibility-metrics.repository.interface';
import type { CompatibilityMetricsRepository } from './compatibility-metrics.repository.interface';

@ApiTags('Clients & Vendors')
@Controller('client-vendor')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('client-vendor')
@UseInterceptors(LegacyApiInterceptor)
export class ClientVendorController {
  constructor(
    private readonly clientService: ClientService,
    private readonly vendorService: VendorService,
    private readonly prisma: PrismaService,
    @Inject(COMPATIBILITY_METRICS_REPOSITORY) private readonly metrics: CompatibilityMetricsRepository,
  ) {}

  @Post('clients')
  @RequirePermission('client-vendor:client:create')
  @ApiOperation({ summary: 'Create client' })
  async createClient(@Body() dto: CreateClientDto, @CurrentUser() user: any) {
    return this.clientService.create({ tenantId: user.effectiveTenantId, createdById: user.id, ...dto });
  }

  @Get('clients')
  @RequirePermission('client-vendor:client:read')
  @ApiOperation({ summary: 'List clients' })
  async listClients(@CurrentUser() user: any, @Query() filters: PartnerListDto) {
    if (filters.page !== undefined || filters.pageSize !== undefined) return this.clientService.findPage(user.effectiveTenantId, { ...filters, page: filters.page ?? 1, pageSize: filters.pageSize ?? 25 });
    return this.clientService.findAll(user.effectiveTenantId, { search: filters.search });
  }

  @Get('clients/:id')
  @RequirePermission('client-vendor:client:read')
  @ApiOperation({ summary: 'Get client by ID' })
  async getClient(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientService.findById(id, user.effectiveTenantId);
  }

  @Patch('clients/:id')
  @RequirePermission('client-vendor:client:update')
  @ApiOperation({ summary: 'Update client' })
  async updateClient(@Param('id') id: string, @Body() dto: UpdateClientDto, @CurrentUser() user: any) {
    return this.clientService.update(id, { ...dto, tenantId: user.effectiveTenantId, updatedById: user.id });
  }

  @Delete('clients/:id')
  @RequirePermission('client-vendor:client:delete')
  @ApiOperation({ summary: 'Soft-delete client' })
  async deleteClient(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientService.softDelete(id, user.id, user.effectiveTenantId);
  }

  @Post('vendors')
  @RequirePermission('client-vendor:vendor:create')
  @ApiOperation({ summary: 'Create vendor' })
  async createVendor(@Body() dto: CreateVendorDto, @CurrentUser() user: any) {
    return this.vendorService.create({ tenantId: user.effectiveTenantId, createdById: user.id, ...dto });
  }

  @Get('vendors')
  @RequirePermission('client-vendor:vendor:read')
  @ApiOperation({ summary: 'List vendors' })
  async listVendors(@CurrentUser() user: any, @Query() filters: PartnerListDto) {
    if (filters.page !== undefined || filters.pageSize !== undefined) return this.vendorService.findPage(user.effectiveTenantId, { ...filters, page: filters.page ?? 1, pageSize: filters.pageSize ?? 25 });
    return this.vendorService.findAll(user.effectiveTenantId, { search: filters.search });
  }

  @Get('vendors/suggestions')
  @RequirePermission('client-vendor:vendor:read')
  @ApiOperation({ summary: 'Suggest suppliers for a product or category' })
  async vendorSuggestions(
    @CurrentUser() user: any,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    if (!productId && !categoryId) {
      throw new BadRequestException('productId or categoryId is required');
    }
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, tenantId: user.effectiveTenantId, deletedAt: null },
        select: { categoryId: true },
      });
      if (!product) throw new NotFoundException('Product not found');
      resolvedCategoryId = product.categoryId ?? undefined;
    }
    if (!resolvedCategoryId) return [];
    return this.vendorService.findByCategory(user.effectiveTenantId, resolvedCategoryId);
  }

  @Get('vendors/:id')
  @RequirePermission('client-vendor:vendor:read')
  @ApiOperation({ summary: 'Get vendor by ID' })
  async getVendor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vendorService.findById(id, user.effectiveTenantId);
  }

  @Patch('vendors/:id')
  @RequirePermission('client-vendor:vendor:update')
  @ApiOperation({ summary: 'Update vendor' })
  async updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto, @CurrentUser() user: any) {
    return this.vendorService.update(id, { ...dto, tenantId: user.effectiveTenantId, updatedById: user.id });
  }

  @Delete('vendors/:id')
  @RequirePermission('client-vendor:vendor:delete')
  @ApiOperation({ summary: 'Soft-delete vendor' })
  async deleteVendor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vendorService.softDelete(id, user.id, user.effectiveTenantId);
  }

  @Get('compatibility-metrics')
  @RequirePermission('client-vendor:client:read')
  @ApiOperation({ summary: 'Compatibility layer usage metrics (M-003 observability)' })
  getMetrics() {
    return this.metrics.snapshot();
  }
}
