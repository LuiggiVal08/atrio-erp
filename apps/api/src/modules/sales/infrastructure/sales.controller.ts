import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SalesOrderService } from '../application/sales-order.service';
import { SalesInvoiceService } from '../application/sales-invoice.service';
import { CommissionService } from '../application/commission.service';
import { CreateSalesOrderDto, UpdateSalesOrderDto, UpdateSalesOrderStatusDto, CreateSalesInvoiceDto, UpdateSalesInvoiceDto, PayInvoiceDto } from './dto/sales.dto';
import { PayCommissionDto } from './dto/commission.dto';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('sales')
export class SalesController {
  constructor(
    private readonly orderService: SalesOrderService,
    private readonly invoiceService: SalesInvoiceService,
    private readonly commissionService: CommissionService,
  ) {}

  // ---- ORDERS ----

  @Post('orders')
  @RequirePermission('sales:order:create')
  @ApiOperation({ summary: 'Create sales order' })
  async createOrder(@Body() dto: CreateSalesOrderDto, @CurrentUser() user: any) {
    return this.orderService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('orders')
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'List sales orders' })
  async listOrders(@CurrentUser() user: any) {
    return this.orderService.findAll(user.tenantId);
  }

  @Get('orders/:id')
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'Get sales order by ID' })
  async getOrder(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Patch('orders/:id')
  @RequirePermission('sales:order:update')
  @ApiOperation({ summary: 'Update sales order' })
  async updateOrder(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.orderService.update(id, dto);
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('sales:order:delete')
  @ApiOperation({ summary: 'Delete sales order' })
  async deleteOrder(@Param('id') id: string) {
    await this.orderService.delete(id);
  }

  @Patch('orders/:id/status')
  @RequirePermission('sales:order:update')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateSalesOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  // ---- INVOICES ----

  @Post('invoices')
  @RequirePermission('sales:invoice:create')
  @ApiOperation({ summary: 'Create sales invoice' })
  async createInvoice(@Body() dto: CreateSalesInvoiceDto, @CurrentUser() user: any) {
    return this.invoiceService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('invoices')
  @RequirePermission('sales:invoice:read')
  @ApiOperation({ summary: 'List sales invoices' })
  async listInvoices(@CurrentUser() user: any) {
    return this.invoiceService.findAll(user.tenantId);
  }

  @Get('invoices/:id')
  @RequirePermission('sales:invoice:read')
  @ApiOperation({ summary: 'Get sales invoice by ID' })
  async getInvoice(@Param('id') id: string) {
    return this.invoiceService.findById(id);
  }

  @Patch('invoices/:id')
  @RequirePermission('sales:invoice:update')
  @ApiOperation({ summary: 'Update sales invoice' })
  async updateInvoice(@Param('id') id: string, @Body() dto: UpdateSalesInvoiceDto) {
    return this.invoiceService.update(id, dto);
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('sales:invoice:delete')
  @ApiOperation({ summary: 'Delete sales invoice' })
  async deleteInvoice(@Param('id') id: string) {
    await this.invoiceService.delete(id);
  }

  @Patch('invoices/:id/approve')
  @RequirePermission('sales:invoice:approve')
  @ApiOperation({ summary: 'Approve sales invoice (deducts stock)' })
  async approveInvoice(@Param('id') id: string) {
    return this.invoiceService.approve(id);
  }

  @Patch('invoices/:id/pay')
  @RequirePermission('sales:invoice:pay')
  @ApiOperation({ summary: 'Register payment for invoice' })
  async payInvoice(@Param('id') id: string, @Body() dto: PayInvoiceDto) {
    return this.invoiceService.pay(id, dto.paymentMethodId);
  }

  // ---- COMMISSIONS ----

  @Get('commissions')
  @RequirePermission('sales:commission:read')
  @ApiOperation({ summary: 'List all commissions' })
  async listCommissions(@CurrentUser() user: any) {
    return this.commissionService.findAll(user.tenantId);
  }

  @Get('commissions/summary')
  @RequirePermission('sales:commission:read')
  @ApiOperation({ summary: 'Get commission summary counts' })
  async getCommissionSummary(@CurrentUser() user: any) {
    return this.commissionService.getSummary(user.tenantId);
  }

  @Get('commissions/:id')
  @RequirePermission('sales:commission:read')
  @ApiOperation({ summary: 'Get commission by ID' })
  async getCommission(@Param('id') id: string) {
    return this.commissionService.findById(id);
  }

  @Get('commissions/salesperson/:salespersonId')
  @RequirePermission('sales:commission:read')
  @ApiOperation({ summary: 'List commissions by salesperson' })
  async listCommissionsBySalesperson(@CurrentUser() user: any, @Param('salespersonId') salespersonId: string) {
    return this.commissionService.findBySalesperson(user.tenantId, salespersonId);
  }

  @Patch('commissions/:id/pay')
  @RequirePermission('sales:commission:pay')
  @ApiOperation({ summary: 'Mark commission as paid' })
  async payCommission(@Param('id') id: string, @Body() dto: PayCommissionDto) {
    return this.commissionService.pay(id, dto.notes);
  }

  @Patch('commissions/:id/cancel')
  @RequirePermission('sales:commission:pay')
  @ApiOperation({ summary: 'Cancel commission' })
  async cancelCommission(@Param('id') id: string) {
    return this.commissionService.cancel(id);
  }
}
