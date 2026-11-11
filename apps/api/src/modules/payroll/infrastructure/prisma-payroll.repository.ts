import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  CreatePayrollConceptData,
  CreatePayrollInputData,
  CreatePayslipData,
  PayrollPeriodCreateData,
  PayrollRepository,
  PendingCommission,
  UpdatePayrollInputData,
  PersistEmployeeLoanData,
  UpdatePayrollConceptData,
} from '../domain/payroll.repository.interface';
import {
  EmployeeLoan,
  PayrollConcept,
  PayrollInput,
  PayrollPeriod,
  Payslip,
  PayrollPeriodStatus,
} from '../domain/payroll-period.entity';

@Injectable()
export class PrismaPayrollRepository implements PayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPeriod(data: PayrollPeriodCreateData): Promise<PayrollPeriod> {
    return this.prisma.$transaction(async (tx) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const overlap = await tx.payrollPeriod.findFirst({
        where: {
          tenantId: data.tenantId,
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        select: { id: true },
      });
      if (overlap) throw new Error('Payroll period overlaps an existing period');

      return (await tx.payrollPeriod.create({
        data: {
          tenantId: data.tenantId,
          startDate,
          endDate,
          frequency: data.frequency ?? 'MONTHLY',
          notes: data.notes ?? null,
        },
      })) as any;
    }, { isolationLevel: 'Serializable' });
  }

  async findPeriodById(id: string): Promise<PayrollPeriod | null> {
    return (await this.prisma.payrollPeriod.findUnique({ where: { id } })) as any;
  }

  async findPeriodsByTenant(tenantId: string): Promise<PayrollPeriod[]> {
    return (await this.prisma.payrollPeriod.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    })) as any;
  }

  async findOpenPeriodByTenant(tenantId: string): Promise<PayrollPeriod | null> {
    return (await this.prisma.payrollPeriod.findFirst({
      where: { tenantId, status: 'OPEN' },
    })) as any;
  }

  async updatePeriodStatus(id: string, status: PayrollPeriodStatus): Promise<PayrollPeriod> {
    return (await this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: status as any },
    })) as any;
  }

  async transitionPeriodStatus(
    id: string,
    currentStatus: PayrollPeriodStatus,
    nextStatus: PayrollPeriodStatus,
  ): Promise<boolean> {
    const updated = await this.prisma.payrollPeriod.updateMany({
      where: { id, status: currentStatus },
      data: { status: nextStatus },
    });
    return updated.count === 1;
  }

  async createPayslips(periodId: string, data: CreatePayslipData[]): Promise<Payslip[]> {
    if (data.length === 0) throw new Error('Cannot generate an empty payroll period');
    return this.prisma.$transaction(async (tx) => {
      const period = await tx.payrollPeriod.findFirst({
        where: { id: periodId, status: 'CALCULATING' },
        select: { id: true },
      });
      if (!period) throw new Error('Payroll period is no longer calculating');

      const payslips = [];
      for (const payslip of data) {
        const created = await tx.payslip.create({
          data: {
            periodId: payslip.periodId,
            tenantId: payslip.tenantId,
            relationshipId: payslip.relationshipId,
            employeeId: payslip.employeeId,
            employeeName: payslip.employeeName,
            employeeNumber: payslip.employeeNumber,
            contractId: payslip.contractId,
            contractType: payslip.contractType,
            compensationAgreementId: payslip.compensationAgreementId,
            positionAssignmentId: payslip.positionAssignmentId,
            positionId: payslip.positionId,
            positionName: payslip.positionName,
            departmentId: payslip.departmentId,
            departmentName: payslip.departmentName,
            currency: payslip.currency,
            baseSalary: payslip.baseSalary,
            baseEarnings: payslip.baseEarnings,
            otherEarnings: payslip.otherEarnings,
            totalDeductions: payslip.totalDeductions,
            netPay: payslip.netPay,
            periodStart: payslip.periodStart,
            periodEnd: payslip.periodEnd,
            lines: { create: payslip.lines },
          },
          include: { lines: true },
        });
        payslips.push(this.mapPayslipToDomain(created));
      }

      const transition = await tx.payrollPeriod.updateMany({
        where: { id: periodId, status: 'CALCULATING' },
        data: { status: 'LOCKED' },
      });
      if (transition.count !== 1) throw new Error('Payroll period is no longer calculating');
      return payslips;
    });
  }

  async findPayslipsByPeriod(periodId: string): Promise<Payslip[]> {
    return (await this.prisma.payslip.findMany({
      where: { periodId },
      orderBy: { createdAt: 'asc' },
      include: { lines: true },
    })).map(this.mapPayslipToDomain);
  }

  async findPayslipById(id: string, tenantId: string): Promise<Payslip | null> {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    return payslip ? this.mapPayslipToDomain(payslip) : null;
  }

  private mapPayslipToDomain(row: any): Payslip {
    return {
      ...row,
      baseSalary: Number(row.baseSalary),
      baseEarnings: Number(row.baseEarnings),
      otherEarnings: Number(row.otherEarnings),
      totalDeductions: Number(row.totalDeductions),
      netPay: Number(row.netPay),
      lines: row.lines?.map((line: any) => ({ ...line, amount: Number(line.amount) })),
    };
  }

  async countPayslipsByPeriod(periodId: string): Promise<number> {
    return this.prisma.payslip.count({ where: { periodId } });
  }

  async findPayrollConcepts(tenantId: string): Promise<PayrollConcept[]> {
    const concepts = await this.prisma.payrollConcept.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return concepts.map((concept) => ({ ...concept, amount: Number(concept.amount) }));
  }

  async findPayrollConceptById(id: string, tenantId: string): Promise<PayrollConcept | null> {
    const concept = await this.prisma.payrollConcept.findFirst({ where: { id, tenantId } });
    return concept ? { ...concept, amount: Number(concept.amount) } : null;
  }

  async createPayrollConcept(data: CreatePayrollConceptData): Promise<PayrollConcept> {
    const concept = await this.prisma.payrollConcept.create({ data });
    return { ...concept, amount: Number(concept.amount) };
  }

  async updatePayrollConcept(
    id: string,
    tenantId: string,
    data: UpdatePayrollConceptData,
  ): Promise<PayrollConcept | null> {
    const result = await this.prisma.payrollConcept.updateMany({
      where: { id, tenantId },
      data,
    });
    if (result.count !== 1) return null;
    return this.findPayrollConceptById(id, tenantId);
  }

  async createPayrollInput(data: CreatePayrollInputData): Promise<PayrollInput> {
    const input = await this.prisma.payrollInput.create({
      data,
      include: { concept: true },
    });
    return {
      ...input,
      amount: Number(input.amount),
      concept: { ...input.concept, amount: Number(input.concept.amount) },
    };
  }

  async updatePayrollInput(
    id: string,
    tenantId: string,
    periodId: string,
    data: UpdatePayrollInputData,
  ): Promise<PayrollInput | null> {
    const updated = await this.prisma.payrollInput.updateMany({
      where: {
        id,
        tenantId,
        periodId,
        period: { is: { status: 'OPEN' } },
      },
      data,
    });
    if (updated.count !== 1) return null;
    const input = await this.prisma.payrollInput.findUnique({
      where: { id },
      include: { concept: true },
    });
    if (!input) return null;
    return {
      ...input,
      amount: Number(input.amount),
      concept: { ...input.concept, amount: Number(input.concept.amount) },
    };
  }

  async findPayrollInputsByPeriod(periodId: string): Promise<PayrollInput[]> {
    const inputs = await this.prisma.payrollInput.findMany({
      where: { periodId },
      include: { concept: true },
      orderBy: { createdAt: 'asc' },
    });
    return inputs.map((input) => ({
      ...input,
      amount: Number(input.amount),
      concept: { ...input.concept, amount: Number(input.concept.amount) },
    }));
  }

  async createEmployeeLoan(data: PersistEmployeeLoanData): Promise<EmployeeLoan> {
    const loan = await this.prisma.employeeLoan.create({
      data: {
        ...data,
        outstandingBalance: data.principal,
      },
    });
    return this.mapLoan(loan);
  }

  async findEmployeeLoans(tenantId: string, relationshipId?: string): Promise<EmployeeLoan[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: { tenantId, ...(relationshipId ? { relationshipId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return loans.map(this.mapLoan);
  }

  async findActiveEmployeeLoans(tenantId: string, relationshipId: string): Promise<EmployeeLoan[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: { tenantId, relationshipId, isActive: true, outstandingBalance: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });
    return loans.map(this.mapLoan);
  }

  private mapLoan(loan: any): EmployeeLoan {
    return {
      ...loan,
      principal: Number(loan.principal),
      outstandingBalance: Number(loan.outstandingBalance),
      installmentAmount: Number(loan.installmentAmount),
    };
  }

  async findPendingCommissions(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PendingCommission[]> {
    const users = await this.prisma.user.findMany({
      where: { tenantId, employeeId, deletedAt: null },
      select: { id: true },
    });
    if (users.length === 0) return [];

    const commissions = await this.prisma.salesCommission.findMany({
      where: {
        tenantId,
        status: 'pending',
        salespersonId: { in: users.map((user) => user.id) },
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
    });
    return commissions.map((commission) => ({
      id: commission.id,
      amount: Number(commission.commissionAmount),
      currency: commission.currency,
      description: `Sales commission ${commission.id}`,
    }));
  }

  async markCommissionsPaid(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.salesCommission.updateMany({
      where: { id: { in: ids }, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });
  }

  async markPeriodPaidInTransaction(
    tx: Prisma.TransactionClient,
    periodId: string,
    tenantId?: string,
  ): Promise<void> {
    const period = await tx.payrollPeriod.findFirst({
      where: { id: periodId, ...(tenantId ? { tenantId } : {}), status: 'LOCKED' },
      include: { payslips: { include: { lines: true } } },
    });
    if (!period) throw new Error('Payroll period is not locked');

    const netPayments = new Map<string, number>();
    for (const payslip of period.payslips) {
      netPayments.set(
        payslip.currency,
        (netPayments.get(payslip.currency) ?? 0) + Number(payslip.netPay),
      );
    }
    if (![...netPayments.values()].some((amount) => amount > 0)) {
      throw new Error('Payroll period has no positive net amounts to pay');
    }

    const commissionIds = new Set<string>();
    const loanAmounts = new Map<string, { amount: number; count: number }>();
    for (const payslip of period.payslips) {
      for (const line of payslip.lines) {
        if (line.source === 'COMMISSION' && line.sourceId) commissionIds.add(line.sourceId);
        if (line.source === 'LOAN' && line.loanId) {
          const current = loanAmounts.get(line.loanId) ?? { amount: 0, count: 0 };
          current.amount += Number(line.amount);
          current.count += 1;
          loanAmounts.set(line.loanId, current);
        }
      }
    }

    for (const [loanId, payment] of loanAmounts) {
      const loan = await tx.employeeLoan.findUnique({ where: { id: loanId } });
      if (!loan || !loan.isActive || Number(loan.outstandingBalance) < payment.amount) {
        throw new Error('A payroll loan installment is no longer payable');
      }
      const remaining = Number(loan.outstandingBalance) - payment.amount;
      const updated = await tx.employeeLoan.updateMany({
        where: {
          id: loanId,
          isActive: true,
          outstandingBalance: loan.outstandingBalance,
        },
        data: {
          outstandingBalance: remaining,
          paidInstallments: { increment: payment.count },
          ...(remaining === 0 ? { isActive: false } : {}),
        },
      });
      if (updated.count !== 1) throw new Error('A payroll loan changed during payment');
    }

    if (commissionIds.size > 0) {
      const commissionsUpdated = await tx.salesCommission.updateMany({
        where: { id: { in: Array.from(commissionIds) }, tenantId: period.tenantId, status: 'pending' },
        data: { status: 'paid', paidAt: new Date() },
      });
      if (commissionsUpdated.count !== commissionIds.size) {
        throw new Error('A payroll commission is no longer pending payment');
      }
    }

    const updated = await tx.payrollPeriod.updateMany({
      where: { id: periodId, tenantId: period.tenantId, status: 'LOCKED' },
      data: { status: 'PAID' },
    });
    if (updated.count !== 1) throw new Error('Payroll period is no longer locked');
  }
}
