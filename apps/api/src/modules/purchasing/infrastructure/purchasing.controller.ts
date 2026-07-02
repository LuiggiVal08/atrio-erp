import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PurchaseOrderService } from '../application/purchase-order.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, CreatePurchaseReturnDto, ReceiveOrderDto } from './dto/purchasing.dto';

@ApiTags('Purchasing')
@Controller('purchasing')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('purchasing')
export class PurchasingController {
  constructor(private readonly orderService: PurchaseOrderService) {}

  @Post('orders')
  @RequirePermission('purchasing:order:create')
  @ApiOperation({ summary: 'Create purchase order' })
  async createOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.orderService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('orders')
  @RequirePermission('purchasing:order:read')
  @ApiOperation({ summary: 'List purchase orders' })
  async listOrders(@CurrentUser() user: any) {
    return this.orderService.findAll(user.tenantId);
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
  async returnOrder(@Param('id') id: string, @Body() dto: CreatePurchaseReturnDto) {
    return this.orderService.returnOrder(id, dto);
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
}
