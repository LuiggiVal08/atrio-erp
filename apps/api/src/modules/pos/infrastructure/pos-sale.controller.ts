import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { IdempotencyInterceptor } from '@/common/guards/idempotency.interceptor';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PosSaleService } from '../application/pos-sale.service';
import { CreatePosSaleDto, UpdatePosSaleDto, CheckoutPosSaleDto, PayPosSaleDto } from './dto/pos-sale.dto';

@ApiTags('POS Sales')
@Controller('pos/sales')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('sales')
export class PosSaleController {
  constructor(private readonly posSaleService: PosSaleService) {}

  @Post()
  @RequirePermission('sales:order:create')
  @ApiOperation({ summary: 'Create a draft POS sale' })
  async create(@Body() dto: CreatePosSaleDto, @CurrentUser() user: any) {
    return this.posSaleService.createDraft({
      tenantId: user.effectiveTenantId,
      userId: user.id,
      partnerId: dto.partnerId,
      partnerName: dto.partnerName,
      partnerTaxId: dto.partnerTaxId ?? null,
      partnerAddress: dto.partnerAddress ?? null,
      partnerEmail: dto.partnerEmail ?? null,
      partnerPhone: dto.partnerPhone ?? null,
      notes: dto.notes ?? null,
      lines: dto.lines?.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    });
  }

  @Get()
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'List POS sales' })
  async list(@CurrentUser() user: any) {
    return this.posSaleService.findAll(user.effectiveTenantId);
  }

  @Get(':id')
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'Get POS sale by ID' })
  async getById(@Param('id') id: string) {
    return this.posSaleService.findById(id);
  }

  @Patch(':id')
  @RequirePermission('sales:order:update')
  @ApiOperation({ summary: 'Update a draft POS sale' })
  async update(@Param('id') id: string, @Body() dto: UpdatePosSaleDto, @CurrentUser() user: any) {
    return this.posSaleService.updateDraft(id, {
      userId: user.id,
      partnerId: dto.partnerId,
      partnerName: dto.partnerName,
      partnerTaxId: dto.partnerTaxId ?? null,
      partnerAddress: dto.partnerAddress ?? null,
      partnerEmail: dto.partnerEmail ?? null,
      partnerPhone: dto.partnerPhone ?? null,
      notes: dto.notes ?? null,
      lines: dto.lines?.map(l => ({
        id: l.id,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
      })),
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('sales:order:delete')
  @ApiOperation({ summary: 'Delete a draft POS sale' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.posSaleService.deleteDraft(id, user.id);
  }

  @Post(':id/checkout')
  @UseInterceptors(IdempotencyInterceptor)
  @RequirePermission('sales:order:update')
  @ApiOperation({ summary: 'Checkout a POS sale — freeze prices, create Document, transition to PendingPayment' })
  async checkout(@Param('id') id: string, @Body() dto: CheckoutPosSaleDto, @CurrentUser() user: any) {
    return this.posSaleService.checkout(id, user.id, user.effectiveTenantId, dto.warehouseId);
  }

  @Post(':id/pay')
  @UseInterceptors(IdempotencyInterceptor)
  @RequirePermission('sales:order:update')
  @ApiOperation({ summary: 'Pay a POS sale — approve Document, deduct stock, register cash movement' })
  async pay(@Param('id') id: string, @Body() dto: PayPosSaleDto, @CurrentUser() user: any) {
    return this.posSaleService.pay(id, user.id, user.effectiveTenantId, dto.paymentMethodId, dto.cashRegisterId);
  }
}
