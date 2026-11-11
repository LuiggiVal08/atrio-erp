import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { LocalizationTaxService } from '../application/localization-tax.service';
import { CurrencyRateService } from '../application/currency-rate.service';
import { CreateTaxDto, UpdateTaxDto, CreateCurrencyRateDto, SyncCurrencyRateDto } from './dto/localization.dto';
import { ExchangeRateSyncService } from '../application/exchange-rate-sync.service';

@ApiTags('Localization')
@Controller('localization')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('localization')
export class LocalizationController {
  constructor(
    private readonly taxService: LocalizationTaxService,
    private readonly rateService: CurrencyRateService,
    private readonly syncService: ExchangeRateSyncService,
  ) {}

  @Post('taxes')
  @RequirePermission('localization:tax:create')
  @ApiOperation({ summary: 'Create tax' })
  async createTax(@Body() dto: CreateTaxDto, @CurrentUser() user: any) {
    return this.taxService.create({ tenantId: user.effectiveTenantId, ...dto });
  }

  @Get('taxes')
  @RequirePermission('localization:tax:read')
  @ApiOperation({ summary: 'List taxes' })
  async listTaxes(@CurrentUser() user: any) {
    return this.taxService.findAll(user.effectiveTenantId);
  }

  @Get('taxes/:id')
  @RequirePermission('localization:tax:read')
  @ApiOperation({ summary: 'Get tax by ID' })
  async getTax(@Param('id') id: string) {
    return this.taxService.findById(id);
  }

  @Patch('taxes/:id')
  @RequirePermission('localization:tax:update')
  @ApiOperation({ summary: 'Update tax' })
  async updateTax(@Param('id') id: string, @Body() dto: UpdateTaxDto) {
    return this.taxService.update(id, dto);
  }

  @Delete('taxes/:id')
  @RequirePermission('localization:tax:delete')
  @ApiOperation({ summary: 'Delete tax' })
  async deleteTax(@Param('id') id: string) {
    return this.taxService.delete(id);
  }

  @Post('currency-rates')
  @RequirePermission('localization:currency-rate:create')
  @ApiOperation({ summary: 'Create currency rate' })
  async createRate(@Body() dto: CreateCurrencyRateDto, @CurrentUser() user: any) {
    return this.rateService.create({
      tenantId: user.effectiveTenantId,
      fromCurrency: dto.fromCurrency,
      toCurrency: dto.toCurrency,
      rate: dto.rate,
      date: new Date(dto.date),
    });
  }

  @Post('currency-rates/sync')
  @RequirePermission('localization:currency-rate:create')
  @ApiOperation({ summary: 'Synchronize a currency rate from external providers' })
  async syncRate(@Body() dto: SyncCurrencyRateDto, @CurrentUser() user: any) {
    return this.syncService.sync(
      user.effectiveTenantId,
      dto.fromCurrency,
      dto.toCurrency,
      dto.providerIds,
    );
  }

  @Get('currency-rates')
  @RequirePermission('localization:currency-rate:read')
  @ApiOperation({ summary: 'List currency rates' })
  async listRates(
    @CurrentUser() user: any,
    @Query('from') fromCurrency?: string,
    @Query('to') toCurrency?: string,
  ) {
    return this.rateService.findAll(user.effectiveTenantId, fromCurrency, toCurrency);
  }

  @Get('currency-rates/latest')
  @RequirePermission('localization:currency-rate:read')
  @ApiOperation({ summary: 'Get latest rate for date' })
  async getRateAtDate(
    @CurrentUser() user: any,
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
    @Query('date') date: string,
  ) {
    return this.rateService.getRateAtDate(user.effectiveTenantId, fromCurrency, toCurrency, new Date(date));
  }
}
