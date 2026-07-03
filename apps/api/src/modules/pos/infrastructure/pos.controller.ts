import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PosSessionService } from '../application/pos-session.service';
import { QuickSaleService } from '../application/quick-sale.service';
import { OpenSessionDto, CloseSessionDto, QuickSaleDto } from './dto/pos.dto';

@ApiTags('POS')
@Controller('pos')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('sales')
export class PosController {
  constructor(
    private readonly sessionService: PosSessionService,
    private readonly quickSaleService: QuickSaleService,
  ) {}

  @Post('sessions')
  @RequirePermission('sales:order:create')
  @ApiOperation({ summary: 'Open a POS session for a cash register' })
  async openSession(@Body() dto: OpenSessionDto, @CurrentUser() user: any) {
    return this.sessionService.open({
      tenantId: user.tenantId,
      cashRegisterId: dto.cashRegisterId,
      userId: user.id,
      openingBalance: dto.openingBalance,
    });
  }

  @Patch('sessions/:id/close')
  @RequirePermission('sales:order:create')
  @ApiOperation({ summary: 'Close a POS session' })
  async closeSession(@Param('id') id: string, @Body() dto: CloseSessionDto) {
    return this.sessionService.close(id, dto.closingBalance);
  }

  @Get('sessions/current')
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'Get current open session for a register' })
  async getCurrentSession(@CurrentUser() user: any, @Body('cashRegisterId') cashRegisterId?: string) {
    if (!cashRegisterId) return null;
    return this.sessionService.getCurrent(user.tenantId, cashRegisterId);
  }

  @Get('sessions')
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'List POS sessions' })
  async listSessions(@CurrentUser() user: any) {
    return this.sessionService.findAll(user.tenantId);
  }

  @Get('sessions/:id')
  @RequirePermission('sales:order:read')
  @ApiOperation({ summary: 'Get POS session by ID' })
  async getSession(@Param('id') id: string) {
    return this.sessionService.findById(id);
  }

  @Post('quick-sale')
  @RequirePermission('sales:order:create')
  @ApiOperation({ summary: 'Quick sale from POS terminal (creates order + cash movement)' })
  async quickSale(@Body() dto: QuickSaleDto, @CurrentUser() user: any) {
    return this.quickSaleService.execute({
      tenantId: user.tenantId,
      clientId: dto.clientId,
      cashRegisterId: dto.cashRegisterId,
      subtotal: dto.subtotal,
      taxAmount: dto.taxAmount,
      total: dto.total,
      currency: dto.currency ?? 'VED',
      notes: dto.notes,
      paymentMethod: dto.paymentMethod,
      items: dto.items,
      userId: user.id,
    });
  }
}
