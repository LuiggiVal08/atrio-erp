import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FiscalService } from '../domain/fiscal.service';
import { FiscalProcessorService } from '../application/fiscal-processor.service';
import type { FiscalInvoiceData, ContributorType } from '@atrio/core-accounting';

@ApiTags('Fiscal')
@Controller('fiscal')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FiscalController {
  constructor(
    private readonly fiscalService: FiscalService,
    private readonly processor: FiscalProcessorService,
  ) {}

  @Post('calculate')
  @RequirePermission('sales:invoice:fiscal')
  @ApiOperation({ summary: 'Calcular impuestos y retenciones para una factura' })
  calculateTaxes(@Body() body: { invoiceId: string }, @CurrentUser() user: any) {
    return this.processor.processInvoice(body.invoiceId);
  }

  @Post('submit')
  @RequirePermission('sales:invoice:fiscal')
  @ApiOperation({ summary: 'Enviar factura al ente fiscal (DIAN/SENIAT)' })
  submitToFiscal(@Body() body: { invoiceId: string }, @CurrentUser() user: any) {
    return this.processor.submitToFiscalEntity(body.invoiceId);
  }

  @Get('strategies')
  @RequirePermission('sales:invoice:fiscal')
  @ApiOperation({ summary: 'Listar estrategias fiscales disponibles' })
  getStrategies() {
    return { countries: this.fiscalService.getAllCountries() };
  }

  @Get('details/:invoiceId')
  @RequirePermission('sales:invoice:read')
  @ApiOperation({ summary: 'Obtener detalles fiscales de una factura' })
  getFiscalDetails(@Param('invoiceId') invoiceId: string) {
    return this.processor.getFiscalDetails(invoiceId);
  }
}
