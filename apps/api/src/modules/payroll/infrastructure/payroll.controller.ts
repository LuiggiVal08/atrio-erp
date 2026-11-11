import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  Body,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ManagePayrollUseCase } from '../application/manage-payroll.use-case';
import {
  CreateEmployeeLoanDto,
  CreatePayrollConceptDto,
  CreatePayrollInputDto,
  CreatePayrollPeriodDto,
  PayPayrollPeriodDto,
  UpdatePayrollConceptDto,
  UpdatePayrollInputDto,
} from './dto/payroll.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PdfGeneratorService } from '../../reports/infrastructure/pdf-generator.service';

interface PayrollUser {
  id: string;
  tenantId: string;
}

@ApiTags('Payroll')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class PayrollController {
  constructor(
    private readonly managePayrollUseCase: ManagePayrollUseCase,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  @Get('payroll/periods')
  @ApiOperation({ summary: 'List payroll periods for current tenant' })
  listPeriods(@CurrentUser() user: PayrollUser) {
    return this.managePayrollUseCase.listPeriods(this.tenantId(user));
  }

  @Post('payroll/periods')
  @ApiOperation({ summary: 'Create a payroll period' })
  createPeriod(@Body() dto: CreatePayrollPeriodDto, @CurrentUser() user: PayrollUser) {
    return this.runAsBadRequest(() => this.managePayrollUseCase.createPeriod(
      this.tenantId(user),
      dto.startDate,
      dto.endDate,
      dto.notes,
      dto.frequency,
    ));
  }

  @Post('payroll/periods/:id/generate')
  @ApiOperation({ summary: 'Generate payslips for a period' })
  async generate(@Param('id') id: string, @CurrentUser() user: PayrollUser) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.runAsBadRequest(() => this.managePayrollUseCase.generate(id));
  }

  @Post('payroll/periods/:id/lock')
  @ApiOperation({ summary: 'Lock a payroll period' })
  async lock(@Param('id') id: string, @CurrentUser() user: PayrollUser) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.runAsBadRequest(() => this.managePayrollUseCase.lock(id));
  }

  @Post('payroll/periods/:id/pay')
  @ApiOperation({ summary: 'Pay a locked payroll period from a cash register' })
  async pay(
    @Param('id') id: string,
    @Body() dto: PayPayrollPeriodDto,
    @CurrentUser() user: PayrollUser,
  ) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    if (dto.method === 'cash') {
      const { cashRegisterId } = dto;
      if (!cashRegisterId) throw new BadRequestException('Select a cash register to pay payroll');
      return this.runAsBadRequest(() => this.managePayrollUseCase.payWithCash(
        id,
        this.tenantId(user),
        cashRegisterId,
        user.id,
      ));
    }
    const { bankAccountId } = dto;
    if (!bankAccountId) throw new BadRequestException('Select a bank account to pay payroll');
    return this.runAsBadRequest(() => this.managePayrollUseCase.payWithBank(
      id,
      this.tenantId(user),
      bankAccountId,
      user.id,
    ));
  }

  @Post('payroll/periods/:id/close')
  @ApiOperation({ summary: 'Close a payroll period' })
  async close(@Param('id') id: string, @CurrentUser() user: PayrollUser) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.runAsBadRequest(() => this.managePayrollUseCase.close(id));
  }

  @Get('payroll/periods/:id')
  @ApiOperation({ summary: 'Get payroll period by ID' })
  async findPeriod(@Param('id') id: string, @CurrentUser() user: PayrollUser) {
    return this.assertPeriodTenant(id, this.tenantId(user));
  }

  @Get('payroll/periods/:id/payslips')
  @ApiOperation({ summary: 'Get payslips for a period' })
  async getPayslips(@Param('id') id: string, @CurrentUser() user: PayrollUser) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.managePayrollUseCase.findPayslips(id);
  }

  @Get('payroll/payslips/:payslipId/receipt')
  @ApiOperation({ summary: 'Download an individual payroll receipt as PDF' })
  async downloadPayslipReceipt(
    @Param('payslipId') payslipId: string,
    @CurrentUser() user: PayrollUser,
    @Res() response: Response,
  ) {
    const payslip = await this.managePayrollUseCase.findPayslipById(payslipId, this.tenantId(user));
    if (!payslip) throw new NotFoundException('Payslip not found');
    const period = await this.assertPeriodTenant(payslip.periodId, this.tenantId(user));
    const amount = (value: number, currency: string) =>
      `${currency} ${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pdf = await this.pdfGenerator.generate('payroll-payslip', {
      employeeName: payslip.employeeName,
      employeeNumber: payslip.employeeNumber || '—',
      departmentName: payslip.departmentName || '—',
      positionName: payslip.positionName || '—',
      periodLabel: `${period.startDate.toLocaleDateString('es-VE')} – ${period.endDate.toLocaleDateString('es-VE')}`,
      generatedAt: new Date().toLocaleString('es-VE'),
      currency: payslip.currency,
      baseSalary: amount(payslip.baseSalary, payslip.currency),
      baseEarnings: amount(payslip.baseEarnings, payslip.currency),
      otherEarnings: amount(payslip.otherEarnings, payslip.currency),
      totalEarnings: amount(payslip.baseEarnings + payslip.otherEarnings, payslip.currency),
      totalDeductions: amount(payslip.totalDeductions, payslip.currency),
      netPay: amount(payslip.netPay, payslip.currency),
      lines: (payslip.lines ?? []).map((line) => ({
        type: line.type === 'DEDUCTION' ? 'Deducción' : 'Asignación',
        description: line.description,
        amount: amount(line.amount, line.currency),
      })),
    });
    response
      .type('application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="payslip-${payslip.id}.pdf"`)
      .setHeader('Cache-Control', 'no-store')
      .send(pdf);
  }

  @Get('payroll/concepts')
  @ApiOperation({ summary: 'List payroll concepts for current tenant' })
  listConcepts(@CurrentUser() user: PayrollUser) {
    return this.managePayrollUseCase.listConcepts(this.tenantId(user));
  }

  @Get('payroll/employees')
  @ApiOperation({ summary: 'List active employment relationships eligible for payroll' })
  listPayrollEmployees(@CurrentUser() user: PayrollUser) {
    return this.managePayrollUseCase.listPayrollEmployees(this.tenantId(user));
  }

  @Post('payroll/concepts')
  @ApiOperation({ summary: 'Create a payroll concept' })
  createConcept(@Body() dto: CreatePayrollConceptDto, @CurrentUser() user: PayrollUser) {
    return this.runAsBadRequest(() => this.managePayrollUseCase.createConcept({
      ...dto,
      tenantId: this.tenantId(user),
    }));
  }

  @Patch('payroll/concepts/:id')
  @ApiOperation({ summary: 'Update a payroll concept' })
  async updateConcept(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollConceptDto,
    @CurrentUser() user: PayrollUser,
  ) {
    const concept = await this.managePayrollUseCase.updateConcept(id, this.tenantId(user), dto);
    if (!concept) throw new NotFoundException('Payroll concept not found');
    return concept;
  }

  @Get('payroll/periods/:id/inputs')
  @ApiOperation({ summary: 'List payroll inputs for a period' })
  async listInputs(@Param('id') id: string, @CurrentUser() user: PayrollUser) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.managePayrollUseCase.listInputs(id);
  }

  @Post('payroll/periods/:id/inputs')
  @ApiOperation({ summary: 'Add an employee payroll adjustment' })
  async addInput(
    @Param('id') id: string,
    @Body() dto: CreatePayrollInputDto,
    @CurrentUser() user: PayrollUser,
  ) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.runAsBadRequest(() => this.managePayrollUseCase.addInput({
      ...dto,
      periodId: id,
      tenantId: this.tenantId(user),
    }));
  }

  @Patch('payroll/periods/:id/inputs/:inputId')
  @ApiOperation({ summary: 'Update an employee adjustment in an open payroll period' })
  async updateInput(
    @Param('id') id: string,
    @Param('inputId') inputId: string,
    @Body() dto: UpdatePayrollInputDto,
    @CurrentUser() user: PayrollUser,
  ) {
    await this.assertPeriodTenant(id, this.tenantId(user));
    return this.runAsBadRequest(() => this.managePayrollUseCase.updateInput(inputId, {
      ...dto,
      periodId: id,
      tenantId: this.tenantId(user),
    }));
  }

  @Get('payroll/loans')
  @ApiOperation({ summary: 'List employee loans' })
  @ApiQuery({ name: 'relationshipId', required: false })
  listLoans(
    @CurrentUser() user: PayrollUser,
    @Query('relationshipId') relationshipId?: string,
  ) {
    return this.managePayrollUseCase.listLoans(this.tenantId(user), relationshipId);
  }

  @Post('payroll/loans')
  @ApiOperation({ summary: 'Create an employee loan or advance' })
  createLoan(@Body() dto: CreateEmployeeLoanDto, @CurrentUser() user: PayrollUser) {
    return this.runAsBadRequest(() => this.managePayrollUseCase.createLoan({
      ...dto,
      tenantId: this.tenantId(user),
    }));
  }

  private tenantId(user: PayrollUser | null | undefined): string {
    if (!user?.tenantId || !user.id) throw new UnauthorizedException('Authenticated tenant context is required');
    return user.tenantId;
  }

  private async assertPeriodTenant(id: string, tenantId: string) {
    try {
      const period = await this.managePayrollUseCase.findPeriodById(id);
      if (period.tenantId !== tenantId) throw new NotFoundException('Payroll period not found');
      return period;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Error && error.message === 'Payroll period not found') {
        throw new NotFoundException('Payroll period not found');
      }
      throw error;
    }
  }

  private async runAsBadRequest<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Payroll request failed');
    }
  }
}
