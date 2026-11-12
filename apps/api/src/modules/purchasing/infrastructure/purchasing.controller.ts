import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PurchaseOrderService } from '../application/purchase-order.service';
import { PurchaseReturnService } from '../application/purchase-return.service';
import { PurchasingMetricsService } from '../application/purchasing-metrics.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, UpdatePurchaseOrderStatusDto, CreatePurchaseReturnDto, UpdatePurchaseReturnStatusDto, ReceiveOrderDto } from './dto/purchasing.dto';

@ApiTags('Purchasing')
@Controller('purchasing')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('purchasing')
export class PurchasingController {
  constructor(
    private readonly orderService: PurchaseOrderService,
    private readonly returnService: PurchaseReturnService,
    private readonly metricsService: PurchasingMetricsService,
  ) {}

  @Post('orders')
  @RequirePermission('purchasing:order:create')
  @ApiOperation({ summary: 'Create purchase order' })
  async createOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.orderService.create({ tenantId: user.effectiveTenantId, createdById: user.id, ...dto });
  }

  @Get('orders')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'List purchase orders' })
  async listOrders(@CurrentUser() user: any) {
    return this.orderService.findAll(user.effectiveTenantId);
  }

  @Get('metrics/delivery')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'Supplier delivery-time metrics' })
  async deliveryMetrics(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getDeliveryMetrics(user.effectiveTenantId, from, to);
  }

  @Get('metrics/spend-by-category')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'Purchase spend grouped by supplier category' })
  async spendByCategory(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getSpendByCategory(user.effectiveTenantId, from, to);
  }

  @Get('metrics/vendor-delivery/:vendorId')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'Supplier delivery history' })
  async vendorDeliveryHistory(
    @CurrentUser() user: any,
    @Param('vendorId') vendorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getVendorDeliveryHistory(user.effectiveTenantId, vendorId, from, to);
  }

  @Get('metrics/pending-deliveries')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'Pending purchase order deliveries' })
  async pendingDeliveries(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metricsService.getPendingDeliveries(user.effectiveTenantId, from, to);
  }

  @Get('orders/:id')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  async getOrder(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Patch('orders/:id')
  @RequirePermission('purchasing:order:update')
  @ApiOperation({ summary: 'Update purchase order' })
  async updateOrder(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.orderService.update(id, dto);
  }

  @Delete('orders/:id')
  @RequirePermission('purchasing:order:delete')
  @ApiOperation({ summary: 'Delete purchase order' })
  async deleteOrder(@Param('id') id: string) {
    return this.orderService.delete(id);
  }

  @Patch('orders/:id/approve')
  @RequirePermission('purchasing:order:approve')
  @ApiOperation({ summary: 'Approve purchase order' })
  async approveOrder(@Param('id') id: string) {
    return this.orderService.approve(id);
  }

  @Post('orders/:id/return')
  @RequirePermission('purchasing:order:return')
  @ApiOperation({ summary: 'Return items from a received purchase order' })
  async returnOrder(@Param('id') id: string, @Body() dto: CreatePurchaseReturnDto, @CurrentUser() user: any) {
    return this.orderService.returnOrder(id, { ...dto, userId: user.id });
  }

  @Patch('orders/:id/receive')
  @RequirePermission('purchasing:order:receive')
  @ApiOperation({ summary: 'Receive purchase order (partial or full)' })
  async receiveOrder(@Param('id') id: string, @Body() dto?: ReceiveOrderDto) {
    return this.orderService.receive(id, dto);
  }

  @Patch('orders/:id/receive/complete')
  @RequirePermission('purchasing:order:receive')
  @ApiOperation({ summary: 'Complete partial receive' })
  async completeReceive(@Param('id') id: string) {
    return this.orderService.completeReceive(id);
  }

  @Patch('orders/:id/status')
  @RequirePermission('purchasing:order:update')
  @ApiOperation({ summary: 'Update purchase order status' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderStatusDto) {
    return this.orderService.update(id, { status: dto.status });
  }

  @Get('returns')
  @RequirePermission('purchasing:return:read')
  @ApiOperation({ summary: 'List purchase returns' })
  async listReturns(@CurrentUser() user: any) {
    return this.returnService.findAll(user.effectiveTenantId);
  }

  @Get('returns/:id')
  @RequirePermission('purchasing:return:read')
  @ApiOperation({ summary: 'Get purchase return by ID' })
  async getReturn(@Param('id') id: string) {
    return this.returnService.findById(id);
  }

  @Patch('returns/:id/status')
  @RequirePermission('purchasing:return:update')
  @ApiOperation({ summary: 'Update purchase return status' })
  async updateReturnStatus(@Param('id') id: string, @Body() dto: UpdatePurchaseReturnStatusDto) {
    return this.returnService.updateStatus(id, dto.status);
  }

  @Delete('returns/:id')
  @RequirePermission('purchasing:return:delete')
  @ApiOperation({ summary: 'Delete purchase return' })
  async deleteReturn(@Param('id') id: string) {
    return this.returnService.delete(id);
  }
}
