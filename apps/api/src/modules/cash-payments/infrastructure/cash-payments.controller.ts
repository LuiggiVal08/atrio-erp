import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CashRegisterService } from '../application/cash-register.service';
import { CashMovementService } from '../application/cash-movement.service';
import { BankAccountService } from '../application/bank-account.service';
import { CreateCashRegisterDto, CreatePaymentMethodDto, UpdatePaymentMethodDto, RegisterMovementDto, CreateBankAccountDto, UpdateBankAccountDto } from './dto/cash-payments.dto';
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
  @ApiOperation({ summary: 'Create cash register' })
  async createRegister(@Body() dto: CreateCashRegisterDto, @CurrentUser() user: any) {
    return this.registerService.create({ tenantId: user.effectiveTenantId, ...dto });
  }

  @Get('registers')
  @ApiOperation({ summary: 'List cash registers' })
  async listRegisters(@CurrentUser() user: any) {
    return this.registerService.findAll(user.effectiveTenantId);
  }

  @Get('registers/:id/detail')
  @ApiOperation({ summary: 'Get operational cash register detail' })
  async getRegisterDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.registerService.getDetail(id, user.effectiveTenantId);
  }

  @Delete('registers/:id')
  @ApiOperation({ summary: 'Soft-delete cash register' })
  async deleteRegister(@Param('id') id: string) {
    return this.registerService.softDelete(id);
  }

  @Post('payment-methods')
  @ApiOperation({ summary: 'Create payment method' })
  async createPaymentMethod(@Body() dto: CreatePaymentMethodDto, @CurrentUser() user: any) {
    return this.repo.createPaymentMethod({ tenantId: user.effectiveTenantId, ...dto });
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'List payment methods' })
  async listPaymentMethods(@CurrentUser() user: any) {
    return this.repo.findAllPaymentMethods(user.effectiveTenantId);
  }

  @Patch('payment-methods/:id')
  @ApiOperation({ summary: 'Update payment method' })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user: any,
  ) {
    const data = {
      ...dto,
      ...(dto.type === 'cash' ? { currency: '' } : {}),
    };
    const method = await this.repo.updatePaymentMethod(id, user.effectiveTenantId, data);
    if (!method) throw new NotFoundException('Payment method not found');
    return method;
  }

  @Delete('payment-methods/:id')
  @ApiOperation({ summary: 'Delete payment method' })
  async deletePaymentMethod(@Param('id') id: string) {
    return this.repo.deletePaymentMethod(id);
  }

  @Post('registers/:id/movements')
  @ApiOperation({ summary: 'Register cash movement (in/out)' })
  async registerMovement(@Param('id') id: string, @Body() dto: RegisterMovementDto, @CurrentUser() user: any) {
    return this.movementService.register({
      tenantId: user.effectiveTenantId,
      cashRegisterId: id,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency,
      exchangeRate: dto.exchangeRate,
      description: dto.description,
      category: dto.category,
      receiptName: dto.receiptName,
      userId: user.id,
    });
  }

  @Get('registers/:id/movements')
  @ApiOperation({ summary: 'List movements for a register' })
  async listMovements(@Param('id') id: string) {
    return this.movementService.getMovements(id);
  }

  // ---- Bank Accounts ----

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Create bank account' })
  async createBankAccount(@Body() dto: CreateBankAccountDto, @CurrentUser() user: any) {
    return this.bankAccountService.create({ tenantId: user.effectiveTenantId, ...dto });
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'List bank accounts' })
  async listBankAccounts(@CurrentUser() user: any) {
    return this.bankAccountService.findAll(user.effectiveTenantId);
  }

  @Get('bank-accounts/:id')
  @ApiOperation({ summary: 'Get bank account by ID' })
  async getBankAccount(@Param('id') id: string) {
    return this.bankAccountService.findById(id);
  }

  @Patch('bank-accounts/:id')
  @ApiOperation({ summary: 'Update bank account' })
  async updateBankAccount(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.bankAccountService.update(id, dto);
  }

  @Delete('bank-accounts/:id')
  @ApiOperation({ summary: 'Delete bank account' })
  async deleteBankAccount(@Param('id') id: string) {
    return this.bankAccountService.delete(id);
  }
}
