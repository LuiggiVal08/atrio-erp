import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ClientService } from '../application/client.service';
import { VendorService } from '../application/vendor.service';
import { CreateClientDto, UpdateClientDto, CreateVendorDto, UpdateVendorDto } from './dto/client-vendor.dto';

@ApiTags('Clients & Vendors')
@Controller('client-vendor')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('client-vendor')
export class ClientVendorController {
  constructor(
    private readonly clientService: ClientService,
    private readonly vendorService: VendorService,
  ) {}

  @Post('clients')
  @RequirePermission('client-vendor:client:create')
  @ApiOperation({ summary: 'Create client' })
  async createClient(@Body() dto: CreateClientDto, @CurrentUser() user: any) {
    return this.clientService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('clients')
  @RequirePermission('client-vendor:client:read')
  @ApiOperation({ summary: 'List clients' })
  async listClients(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.clientService.findAll(user.tenantId, { search });
  }

  @Get('clients/:id')
  @RequirePermission('client-vendor:client:read')
  @ApiOperation({ summary: 'Get client by ID' })
  async getClient(@Param('id') id: string) {
    return this.clientService.findById(id);
  }

  @Patch('clients/:id')
  @RequirePermission('client-vendor:client:update')
  @ApiOperation({ summary: 'Update client' })
  async updateClient(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientService.update(id, dto);
  }

  @Delete('clients/:id')
  @RequirePermission('client-vendor:client:delete')
  @ApiOperation({ summary: 'Soft-delete client' })
  async deleteClient(@Param('id') id: string) {
    return this.clientService.softDelete(id);
  }

  @Post('vendors')
  @RequirePermission('client-vendor:vendor:create')
  @ApiOperation({ summary: 'Create vendor' })
  async createVendor(@Body() dto: CreateVendorDto, @CurrentUser() user: any) {
    return this.vendorService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('vendors')
  @RequirePermission('client-vendor:vendor:read')
  @ApiOperation({ summary: 'List vendors' })
  async listVendors(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.vendorService.findAll(user.tenantId, { search });
  }

  @Get('vendors/:id')
  @RequirePermission('client-vendor:vendor:read')
  @ApiOperation({ summary: 'Get vendor by ID' })
  async getVendor(@Param('id') id: string) {
    return this.vendorService.findById(id);
  }

  @Patch('vendors/:id')
  @RequirePermission('client-vendor:vendor:update')
  @ApiOperation({ summary: 'Update vendor' })
  async updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.update(id, dto);
  }

  @Delete('vendors/:id')
  @RequirePermission('client-vendor:vendor:delete')
  @ApiOperation({ summary: 'Soft-delete vendor' })
  async deleteVendor(@Param('id') id: string) {
    return this.vendorService.softDelete(id);
  }
}
