import {
  Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException, ParseUUIDPipe, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateTenantUseCase } from '../application/create-tenant.use-case';
import { GetTenantUseCase } from '../application/get-tenant.use-case';
import { UpdateTenantUseCase } from '../application/update-tenant.use-case';
import { TenantModuleService } from '../application/tenant-module.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@ApiTags('Tenants')
@Controller()
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
    private readonly tenantModuleService: TenantModuleService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('admin/tenants/check-slug')
  @ApiOperation({ summary: 'Check if a slug is available (no auth required)' })
  async checkSlug(@Query('slug') slug: string) {
    if (!slug || slug.length < 3) {
      return { available: false, slug };
    }
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!existing) {
      return { available: true, slug };
    }
    let counter = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug: `${slug}-${counter}` } })) {
      counter++;
    }
    return { available: false, slug, suggestion: `${slug}-${counter}` };
  }

  @Post('admin/tenants')
  @ApiOperation({ summary: 'Create a new tenant with admin user' })
  async create(@Body() dto: CreateTenantDto) {
    try {
      return await this.createTenantUseCase.execute(dto);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const meta = error?.meta?.target as string[] | undefined;
        if (meta?.includes('slug')) throw new BadRequestException('Slug already exists');
        throw new BadRequestException('Tax ID already exists');
      }
      throw error;
    }
  }

  @Get('tenants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll() {
    return this.getTenantUseCase.findAll();
  }

  @Get('tenants/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const tenant = await this.getTenantUseCase.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  @Patch('admin/tenants/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.updateTenantUseCase.execute(id, dto);
  }

  @Post('admin/tenants/:id/suspend')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.updateTenantUseCase.suspend(id);
  }

  @Post('admin/tenants/:id/reactivate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.updateTenantUseCase.reactivate(id);
  }

  @Get('admin/tenants/:id/modules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enabled modules for a tenant' })
  getModules(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantModuleService.getEnabledModules(id);
  }

  @Patch('admin/tenants/:id/modules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update enabled modules for a tenant' })
  updateModules(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModulesDto) {
    return this.tenantModuleService.setEnabledModules(id, dto.enabledModules);
  }
}
