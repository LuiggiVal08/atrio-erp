import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ManagePurchasingUseCase } from '../application/manage-purchasing.use-case';
import { PurchasingOrder } from '../domain/purchasing-order.entity';
import { GoodsReceipt } from '../domain/goods-receipt.entity';
import { CreatePurchaseOrderV2Dto, StartReceivingDto, ReceiveGoodsDto } from './dto/purchasing-v2.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('tenants/:tenantId/purchase-orders')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('purchasing')
export class PurchasingV2Controller {
  constructor(private readonly useCase: ManagePurchasingUseCase) {}

  @Post()
  @RequirePermission('purchasing:order:create')
  async createOrder(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePurchaseOrderV2Dto,
    @CurrentUser() user: any,
  ) {
    const effectiveTenantId = user.effectiveTenantId ?? tenantId;
    const order = await this.useCase.createOrder({
      tenantId: effectiveTenantId,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      supplierTaxId: dto.supplierTaxId,
      supplierEmail: dto.supplierEmail,
      supplierPhone: dto.supplierPhone,
      lines: dto.lines,
      notes: dto.notes,
    });
    return this.toOrderResponse(order);
  }

  @Get()
  @RequirePermission('purchasing:order:list')
  async listOrders(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: any,
  ) {
    const effectiveTenantId = user.effectiveTenantId ?? tenantId;
    const orders = await this.useCase.listOrders(effectiveTenantId);
    return orders.map(o => this.toOrderResponse(o));
  }

  @Get(':id')
  @RequirePermission('purchasing:order:read')
  async getOrder(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const effectiveTenantId = user.effectiveTenantId ?? tenantId;
    const { order, receipt } = await this.useCase.getOrder(id);
    order.checkTenant(effectiveTenantId);
    return {
      order: this.toOrderResponse(order),
      goodsReceipt: receipt ? this.toReceiptResponse(receipt) : null,
    };
  }

  @Post(':id/approve')
  @RequirePermission('purchasing:order:approve')
  async approveOrder(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const effectiveTenantId = user.effectiveTenantId ?? tenantId;
    const order = await this.useCase.approveOrder(id);
    order.checkTenant(effectiveTenantId);
    return this.toOrderResponse(order);
  }

  @Post(':id/receipts')
  @RequirePermission('purchasing:order:receive')
  async startReceiving(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: StartReceivingDto,
    @CurrentUser() user: any,
  ) {
    const effectiveTenantId = user.effectiveTenantId ?? tenantId;
    const { order, receipt } = await this.useCase.startReceiving({
      purchaseOrderId: id,
      receivedAt: new Date(dto.receivedAt),
    });
    order.checkTenant(effectiveTenantId);
    return {
      purchaseOrder: this.toOrderResponse(order),
      goodsReceipt: this.toReceiptResponse(receipt),
    };
  }

  @Post(':orderId/receipts/:receiptId/receive')
  @RequirePermission('purchasing:order:receive')
  async receiveGoods(
    @Param('tenantId') tenantId: string,
    @Param('receiptId') receiptId: string,
    @Body() dto: ReceiveGoodsDto,
    @CurrentUser() user: any,
  ) {
    const effectiveTenantId = user.effectiveTenantId ?? tenantId;
    const { order, receipt } = await this.useCase.receiveGoods({
      goodsReceiptId: receiptId,
      lines: dto.lines,
    });
    order.checkTenant(effectiveTenantId);
    return {
      purchaseOrder: this.toOrderResponse(order),
      goodsReceipt: this.toReceiptResponse(receipt),
    };
  }

  private toOrderResponse(order: PurchasingOrder) {
    return {
      id: order.id,
      tenantId: order.tenantId,
      status: order.status,
      supplierId: order.supplierSnapshot.supplierId,
      supplierName: order.supplierSnapshot.name,
      supplierTaxId: order.supplierSnapshot.taxId,
      supplierEmail: order.supplierSnapshot.email,
      supplierPhone: order.supplierSnapshot.phone,
      lines: order.lines.map(l => ({
        id: l.id,
        productId: l.productSnapshot.productId,
        productSku: l.productSnapshot.sku,
        productName: l.productSnapshot.name,
        productUnit: l.productSnapshot.unit,
        warehouseId: l.productSnapshot.warehouseId,
        orderedQuantity: l.orderedQuantity,
        unitCost: l.unitCost,
        taxRate: l.taxRate,
        discountRate: l.discountRate,
        totalCost: l.totalCost,
        receivedQuantity: l.receivedQuantity,
      })),
      notes: order.notes,
      completedAt: order.completedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private toReceiptResponse(receipt: GoodsReceipt) {
    return {
      id: receipt.id,
      purchasingOrderId: receipt.purchasingOrderId,
      tenantId: receipt.tenantId,
      status: receipt.status,
      receivedAt: receipt.receivedAt.toISOString(),
      lines: receipt.lines.map(l => ({
        id: l.id,
        purchasingOrderLineId: l.purchasingOrderLineId,
        receivedQuantity: l.receivedQuantity,
        damagedQuantity: l.damagedQuantity,
        notes: l.notes ?? null,
      })),
      notes: receipt.notes ?? null,
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString(),
    };
  }
}
