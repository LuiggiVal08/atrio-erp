import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
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
@RequireModule('cash-payments')
export class PosController {
  constructor(
    private readonly sessionService: PosSessionService,
    private readonly quickSaleService: QuickSaleService,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Open a POS session for a cash register' })
  async openSession(@Body() dto: OpenSessionDto, @CurrentUser() user: any) {
    return this.sessionService.open({
      tenantId: user.effectiveTenantId,
      cashRegisterId: dto.cashRegisterId,
      userId: user.id,
      openingBalance: dto.openingBalance,
      openingDenominations: dto.openingDenominations,
    });
  }

  @Patch('sessions/:id/close')
  @ApiOperation({ summary: 'Close a POS session' })
  async closeSession(@Param('id') id: string, @Body() dto: CloseSessionDto, @CurrentUser() user: any) {
    return this.sessionService.close(id, dto.closingBalance, {
      closingDifference: dto.closingDifference,
      closingNote: dto.closingNote,
      closingDenominations: dto.closingDenominations,
    }, user.effectiveTenantId);
  }

  @Get('sessions/current')
  @ApiOperation({ summary: 'Get current open session for a register' })
  async getCurrentSession(@CurrentUser() user: any, @Query('cashRegisterId') cashRegisterId?: string) {
    if (!cashRegisterId) return null;
    return this.sessionService.getCurrent(user.effectiveTenantId, cashRegisterId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List POS sessions' })
  async listSessions(@CurrentUser() user: any) {
    return this.sessionService.findAll(user.effectiveTenantId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get POS session by ID' })
  async getSession(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionService.findById(id, user.effectiveTenantId);
  }

  @Post('quick-sale')
  @RequireModule('sales')
  @RequirePermission('sales:order:create')
  @ApiOperation({ summary: 'Quick sale from POS terminal (creates order + cash movement)' })
  async quickSale(@Body() dto: QuickSaleDto, @CurrentUser() user: any) {
    return this.quickSaleService.execute({
      tenantId: user.effectiveTenantId,
      clientId: dto.clientId,
      cashRegisterId: dto.cashRegisterId,
      subtotal: dto.subtotal,
      taxAmount: dto.taxAmount,
      total: dto.total,
      currency: dto.currency ?? 'VED',
      notes: dto.notes,
      paymentMethod: dto.paymentMethod,
      paymentAllocations: dto.paymentAllocations,
      items: dto.items,
      userId: user.id,
    });
  }
}
