import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PriceListService } from '../application/price-list.service';
import { CreatePriceListDto, UpdatePriceListDto, AddPriceListItemDto } from './dto/price-list.dto';

@ApiTags('Price Lists')
@Controller('purchasing/price-lists')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('purchasing')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Post()
  @RequirePermission('purchasing:price-list:create')
  @ApiOperation({ summary: 'Create price list' })
  async create(@Body() dto: CreatePriceListDto, @CurrentUser() user: any) {
    return this.priceListService.create(user.tenantId, dto);
  }

  @Get()
  @RequirePermission('purchasing:price-list:read')
  @ApiOperation({ summary: 'List price lists' })
  async findAll(@CurrentUser() user: any) {
    return this.priceListService.findAll(user.tenantId);
  }

  @Get(':id')
  @RequirePermission('purchasing:price-list:read')
  @ApiOperation({ summary: 'Get price list by ID' })
  async findById(@Param('id') id: string) {
    return this.priceListService.findById(id);
  }

  @Patch(':id')
  @RequirePermission('purchasing:price-list:update')
  @ApiOperation({ summary: 'Update price list' })
  async update(@Param('id') id: string, @Body() dto: UpdatePriceListDto) {
    return this.priceListService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('purchasing:price-list:delete')
  @ApiOperation({ summary: 'Delete price list' })
  async delete(@Param('id') id: string) {
    return this.priceListService.delete(id);
  }

  @Post(':id/items')
  @RequirePermission('purchasing:price-list:update')
  @ApiOperation({ summary: 'Add item to price list' })
  async addItem(@Param('id') id: string, @Body() dto: AddPriceListItemDto) {
    return this.priceListService.addItem(id, dto.productId, dto.unitPrice);
  }

  @Delete(':id/items/:itemId')
  @RequirePermission('purchasing:price-list:update')
  @ApiOperation({ summary: 'Remove item from price list' })
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.priceListService.removeItem(id, itemId);
  }

  @Get(':id/items')
  @RequirePermission('purchasing:price-list:read')
  @ApiOperation({ summary: 'List items in price list' })
  async findItems(@Param('id') id: string) {
    return this.priceListService.findItems(id);
  }
}
