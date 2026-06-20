import {
  Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateTenantUseCase } from '../application/create-tenant.use-case';
import { GetTenantUseCase } from '../application/get-tenant.use-case';
import { UpdateTenantUseCase } from '../application/update-tenant.use-case';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@ApiTags('Tenants')
@Controller()
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
  ) {}

  @Post('admin/tenants')
  @ApiOperation({ summary: 'Create a new tenant with admin user' })
  async create(@Body() dto: CreateTenantDto) {
    try {
      return await this.createTenantUseCase.execute(dto);
    } catch (error: any) {
      if (error?.code === 'P2002') {
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
  async findOne(@Param('id') id: string) {
    const tenant = await this.getTenantUseCase.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  @Patch('admin/tenants/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.updateTenantUseCase.execute(id, dto);
  }

  @Post('admin/tenants/:id/suspend')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  suspend(@Param('id') id: string) {
    return this.updateTenantUseCase.suspend(id);
  }

  @Post('admin/tenants/:id/reactivate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  reactivate(@Param('id') id: string) {
    return this.updateTenantUseCase.reactivate(id);
  }
}
