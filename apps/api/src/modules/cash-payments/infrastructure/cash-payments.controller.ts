import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CashRegisterService } from '../application/cash-register.service';
import { CashMovementService } from '../application/cash-movement.service';
import { BankAccountService } from '../application/bank-account.service';
import { CreateCashRegisterDto, CreatePaymentMethodDto, RegisterMovementDto, CreateBankAccountDto, UpdateBankAccountDto } from './dto/cash-payments.dto';
import { PrismaCashPaymentsRepository } from './prisma-cash-payments.repository';

@ApiTags('Cash & Payments')
@Controller('cash-payments')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('cash-payments')
export class CashPaymentsController {
  constructor(
    private readonly registerService: CashRegisterService,
    private readonly movementService: CashMovementService,
    private readonly bankAccountService: BankAccountService,
    private readonly repo: PrismaCashPaymentsRepository,
  ) {}

  @Post('registers')
  @RequirePermission('cash-payments:register:create')
  @ApiOperation({ summary: 'Create cash register' })
  async createRegister(@Body() dto: CreateCashRegisterDto, @CurrentUser() user: any) {
    return this.registerService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('registers')
  @RequirePermission('cash-payments:register:read')
  @ApiOperation({ summary: 'List cash registers' })
  async listRegisters(@CurrentUser() user: any) {
    return this.registerService.findAll(user.tenantId);
  }

  @Delete('registers/:id')
  @RequirePermission('cash-payments:register:delete')
  @ApiOperation({ summary: 'Soft-delete cash register' })
  async deleteRegister(@Param('id') id: string) {
    return this.registerService.softDelete(id);
  }

  @Post('payment-methods')
  @RequirePermission('cash-payments:payment-method:create')
  @ApiOperation({ summary: 'Create payment method' })
  async createPaymentMethod(@Body() dto: CreatePaymentMethodDto, @CurrentUser() user: any) {
    return this.repo.createPaymentMethod({ tenantId: user.tenantId, ...dto });
  }

  @Get('payment-methods')
  @RequirePermission('cash-payments:payment-method:read')
  @ApiOperation({ summary: 'List payment methods' })
  async listPaymentMethods(@CurrentUser() user: any) {
    return this.repo.findAllPaymentMethods(user.tenantId);
  }

  @Delete('payment-methods/:id')
  @RequirePermission('cash-payments:payment-method:delete')
  @ApiOperation({ summary: 'Delete payment method' })
  async deletePaymentMethod(@Param('id') id: string) {
    return this.repo.deletePaymentMethod(id);
  }

  @Post('registers/:id/movements')
  @RequirePermission('cash-payments:movement:create')
  @ApiOperation({ summary: 'Register cash movement (in/out)' })
  async registerMovement(@Param('id') id: string, @Body() dto: RegisterMovementDto, @CurrentUser() user: any) {
    return this.movementService.register({
      cashRegisterId: id,
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      userId: user.id,
    });
  }

  @Get('registers/:id/movements')
  @RequirePermission('cash-payments:movement:read')
  @ApiOperation({ summary: 'List movements for a register' })
  async listMovements(@Param('id') id: string) {
    return this.movementService.getMovements(id);
  }

  // ---- Bank Accounts ----

  @Post('bank-accounts')
  @RequirePermission('cash-payments:bank-account:create')
  @ApiOperation({ summary: 'Create bank account' })
  async createBankAccount(@Body() dto: CreateBankAccountDto, @CurrentUser() user: any) {
    return this.bankAccountService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('bank-accounts')
  @RequirePermission('cash-payments:bank-account:read')
  @ApiOperation({ summary: 'List bank accounts' })
  async listBankAccounts(@CurrentUser() user: any) {
    return this.bankAccountService.findAll(user.tenantId);
  }

  @Get('bank-accounts/:id')
  @RequirePermission('cash-payments:bank-account:read')
  @ApiOperation({ summary: 'Get bank account by ID' })
  async getBankAccount(@Param('id') id: string) {
    return this.bankAccountService.findById(id);
  }

  @Patch('bank-accounts/:id')
  @RequirePermission('cash-payments:bank-account:update')
  @ApiOperation({ summary: 'Update bank account' })
  async updateBankAccount(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.bankAccountService.update(id, dto);
  }

  @Delete('bank-accounts/:id')
  @RequirePermission('cash-payments:bank-account:delete')
  @ApiOperation({ summary: 'Delete bank account' })
  async deleteBankAccount(@Param('id') id: string) {
    return this.bankAccountService.delete(id);
  }
}
