import { Injectable, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { CashMovementService } from '../../cash-payments/application/cash-movement.service';
import {
  CreateEmployeeLoanData,
  CreatePayrollConceptData,
  PayrollRepository,
  UpdatePayrollConceptData,
} from '../domain/payroll.repository.interface';
import {
  PayrollCalculationMode,
  PayrollFrequency,
  PayrollLineSource,
  PayrollLineType,
  payrollPeriodStateMachine,
  PayrollPeriod,
  Payslip,
  PayrollCalculationContext,
} from '../domain/payroll-period.entity';
import { calculatePayrollTotals } from '../domain/payroll-calculator';
import { EmploymentRepository } from '../../employment/domain/employment.repository.interface';
import { PayrollSnapshotResolver } from './payroll-snapshot-resolver';
import {
  payrollPeriodGenerated,
  payrollPeriodLocked,
  payrollPeriodPaid,
  payrollPeriodClosed,
} from '../domain/domain-events';

@Injectable()
export class ManagePayrollUseCase {
  constructor(
    private readonly payrollRepository: PayrollRepository,
    private readonly employmentRepository: EmploymentRepository,
    private readonly snapshotResolver: PayrollSnapshotResolver,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly cashMovementService?: CashMovementService,
  ) {}

  async createPeriod(
    tenantId: string,
    startDate: string,
    endDate: string,
    notes?: string,
    frequency: PayrollFrequency = 'MONTHLY',
  ): Promise<PayrollPeriod> {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (
      Number.isNaN(parsedStart.getTime()) ||
      Number.isNaN(parsedEnd.getTime()) ||
      parsedEnd.getTime() < parsedStart.getTime()
    ) {
      throw new Error('Payroll period end must be on or after start');
    }
    const existing = await this.payrollRepository.findOpenPeriodByTenant(tenantId);
    if (existing) {
      throw new Error('An open payroll period already exists for this tenant');
    }
    return this.payrollRepository.createPeriod({ tenantId, startDate, endDate, frequency, notes });
  }

  async generate(periodId: string): Promise<Payslip[]> {
    const period = await this.payrollRepository.findPeriodById(periodId);
    if (!period) throw new Error('Payroll period not found');
    payrollPeriodStateMachine.assertValidTransition(period.status, 'CALCULATING');

    const ctx: PayrollCalculationContext = {
      periodStart: period.startDate,
      periodEnd: period.endDate,
      tenantId: period.tenantId,
    };

    const claimed = await this.payrollRepository.transitionPeriodStatus(periodId, 'OPEN', 'CALCULATING');
    if (!claimed) throw new Error('Payroll period is no longer open');

    let payslips: Payslip[];
    try {
      const activeRelationships = await this.employmentRepository.findByTenant(period.tenantId, 'ACTIVE');
      const concepts = (await this.payrollRepository.findPayrollConcepts(period.tenantId))
        .filter((concept) => concept.isActive);
      const inputs = await this.payrollRepository.findPayrollInputsByPeriod(period.id);
      const payslipData = [];

      for (const relationship of activeRelationships) {
        const snapshot = await this.snapshotResolver.resolve({
          relationshipId: relationship.id,
          employeeId: relationship.employeeId,
          effectiveDate: ctx.periodEnd,
        });
        if (!snapshot) continue;

        const lines: {
          type: PayrollLineType;
          source: PayrollLineSource;
          sourceId?: string | null;
          conceptId?: string | null;
          payrollInputId?: string | null;
          loanId?: string | null;
          description: string;
          amount: number;
          currency: string;
        }[] = [];
        const baseEarnings = calculatePayrollTotals(
          snapshot.baseSalary,
          ctx.periodStart,
          ctx.periodEnd,
          [],
        ).baseEarnings;
        lines.push({
          type: 'EARNING',
          source: 'BASE',
          description: 'Prorated contractual base salary',
          amount: baseEarnings,
          currency: snapshot.currency,
        });

        for (const concept of concepts.filter((item) => item.recurring)) {
          if (concept.calculationMode === 'FIXED' && concept.currency !== snapshot.currency) {
            throw new Error(`Recurring concept ${concept.code} currency does not match the employee salary`);
          }
          const amount = concept.calculationMode === 'BASE_PERCENTAGE'
            ? Number((baseEarnings * concept.amount / 100).toFixed(2))
            : concept.amount;
          lines.push({
            type: concept.type,
            source: 'CONCEPT',
            sourceId: concept.id,
            conceptId: concept.id,
            description: concept.name,
            amount,
            currency: snapshot.currency,
          });
        }

        for (const input of inputs.filter((item) => item.relationshipId === relationship.id)) {
          const concept = input.concept;
          if (!concept || !concept.isActive) {
            throw new Error('A payroll input references an inactive concept');
          }
          if (concept.currency !== snapshot.currency) {
            throw new Error(`Payroll input ${concept.code} currency does not match the employee salary`);
          }
          lines.push({
            type: concept.type,
            source: 'CONCEPT',
            sourceId: input.id,
            conceptId: concept.id,
            payrollInputId: input.id,
            description: input.description || concept.name,
            amount: input.amount,
            currency: snapshot.currency,
          });
        }

        const commissions = await this.payrollRepository.findPendingCommissions(
          period.tenantId,
          relationship.employeeId,
          ctx.periodStart,
          ctx.periodEnd,
        );
        for (const commission of commissions) {
          if (commission.currency !== snapshot.currency) {
            throw new Error(`Commission ${commission.id} currency does not match the employee salary`);
          }
          lines.push({
            type: 'EARNING',
            source: 'COMMISSION',
            sourceId: commission.id,
            description: commission.description,
            amount: commission.amount,
            currency: snapshot.currency,
          });
        }

        const loans = await this.payrollRepository.findActiveEmployeeLoans(period.tenantId, relationship.id);
        for (const loan of loans) {
          if (loan.currency !== snapshot.currency) {
            throw new Error(`Loan ${loan.id} currency does not match the employee salary`);
          }
          const amount = loan.paidInstallments + 1 >= loan.installmentCount
            ? loan.outstandingBalance
            : Math.min(loan.installmentAmount, loan.outstandingBalance);
          lines.push({
            type: 'DEDUCTION',
            source: 'LOAN',
            sourceId: loan.id,
            loanId: loan.id,
            description: `Loan installment ${loan.paidInstallments + 1}/${loan.installmentCount}`,
            amount,
            currency: snapshot.currency,
          });
        }

        const totals = calculatePayrollTotals(
          snapshot.baseSalary,
          ctx.periodStart,
          ctx.periodEnd,
          lines.filter((line) => line.source !== 'BASE'),
        );
        payslipData.push({
          periodId: period.id,
          tenantId: period.tenantId,
          relationshipId: snapshot.relationshipId,
          employeeId: snapshot.employeeId,
          employeeName: snapshot.employeeName,
          employeeNumber: snapshot.employeeNumber,
          contractId: snapshot.contractId,
          contractType: snapshot.contractType,
          compensationAgreementId: snapshot.compensationAgreementId,
          positionAssignmentId: snapshot.positionAssignmentId,
          positionId: snapshot.positionId,
          positionName: snapshot.positionName,
          departmentId: snapshot.departmentId,
          departmentName: snapshot.departmentName,
          currency: snapshot.currency,
          baseSalary: snapshot.baseSalary,
          baseEarnings: totals.baseEarnings,
          otherEarnings: totals.otherEarnings,
          totalDeductions: totals.totalDeductions,
          netPay: totals.netPay,
          periodStart: ctx.periodStart,
          periodEnd: ctx.periodEnd,
          lines,
        });
      }

      payslips = await this.payrollRepository.createPayslips(period.id, payslipData);
    } catch (error) {
      try {
        await this.payrollRepository.transitionPeriodStatus(periodId, 'CALCULATING', 'OPEN');
      } catch (resetError) {
        throw new AggregateError(
          [error, resetError],
          'Payroll generation failed and the period could not be returned to OPEN',
        );
      }
      throw error;
    }

    this.eventEmitter.emit(
      'payroll.period.generated',
      payrollPeriodGenerated(period.id, period.tenantId, payslips.length),
    );

    this.eventEmitter.emit(
      'payroll.period.locked',
      payrollPeriodLocked(period.id, period.tenantId, payslips.length),
    );

    return payslips;
  }

  async lock(periodId: string): Promise<PayrollPeriod> {
    const period = await this.payrollRepository.findPeriodById(periodId);
    if (!period) throw new Error('Payroll period not found');
    payrollPeriodStateMachine.assertValidTransition(period.status, 'LOCKED');

    const count = await this.payrollRepository.countPayslipsByPeriod(periodId);
    if (count === 0) {
      throw new Error('Cannot lock a period with no payslips');
    }

    const updated = await this.payrollRepository.updatePeriodStatus(periodId, 'LOCKED');

    this.eventEmitter.emit(
      'payroll.period.locked',
      payrollPeriodLocked(period.id, period.tenantId, count),
    );

    return updated;
  }

  async payWithCash(
    periodId: string,
    tenantId: string,
    cashRegisterId: string,
    userId: string,
  ): Promise<PayrollPeriod> {
    if (!this.cashMovementService) throw new Error('Payroll cash payment is not configured');
    const period = await this.payrollRepository.findPeriodById(periodId);
    if (!period || period.tenantId !== tenantId) throw new Error('Payroll period not found');
    if (period.status !== 'LOCKED') throw new Error('Only a locked payroll period can be paid');

    const payslips = await this.payrollRepository.findPayslipsByPeriod(periodId);
    const payments = this.aggregatePayslipPayments(payslips);
    if (payments.length === 0) throw new Error('Payroll period has no positive net amounts to pay');

    await this.cashMovementService.registerPayrollOutflow({
      tenantId,
      cashRegisterId,
      payrollPeriodId: periodId,
      userId,
      payments,
    }, (tx: Prisma.TransactionClient) =>
      this.payrollRepository.markPeriodPaidInTransaction(tx, periodId, tenantId),
    );
    const updated = await this.payrollRepository.findPeriodById(periodId);
    if (!updated) throw new Error('Payroll period not found');
    this.eventEmitter.emit('payroll.period.paid', payrollPeriodPaid(updated.id, updated.tenantId));
    return updated;
  }

  async payWithBank(
    periodId: string,
    tenantId: string,
    bankAccountId: string,
    userId: string,
  ): Promise<PayrollPeriod> {
    if (!this.cashMovementService) throw new Error('Payroll bank payment is not configured');
    const period = await this.payrollRepository.findPeriodById(periodId);
    if (!period || period.tenantId !== tenantId) throw new Error('Payroll period not found');
    if (period.status !== 'LOCKED') throw new Error('Only a locked payroll period can be paid');

    const payslips = await this.payrollRepository.findPayslipsByPeriod(periodId);
    const payments = this.aggregatePayslipPayments(payslips);
    if (payments.length === 0) throw new Error('Payroll period has no positive net amounts to pay');

    await this.cashMovementService.registerPayrollBankOutflow({
      tenantId,
      bankAccountId,
      payrollPeriodId: periodId,
      userId,
      payments,
    }, (tx: Prisma.TransactionClient) =>
      this.payrollRepository.markPeriodPaidInTransaction(tx, periodId, tenantId),
    );
    const updated = await this.payrollRepository.findPeriodById(periodId);
    if (!updated) throw new Error('Payroll period not found');
    this.eventEmitter.emit('payroll.period.paid', payrollPeriodPaid(updated.id, updated.tenantId));
    return updated;
  }

  async close(periodId: string): Promise<PayrollPeriod> {
    const period = await this.payrollRepository.findPeriodById(periodId);
    if (!period) throw new Error('Payroll period not found');
    payrollPeriodStateMachine.assertValidTransition(period.status, 'CLOSED');

    const updated = await this.payrollRepository.updatePeriodStatus(periodId, 'CLOSED');

    this.eventEmitter.emit(
      'payroll.period.closed',
      payrollPeriodClosed(period.id, period.tenantId),
    );

    return updated;
  }

  async findPeriodById(id: string): Promise<PayrollPeriod> {
    const period = await this.payrollRepository.findPeriodById(id);
    if (!period) throw new Error('Payroll period not found');
    return period;
  }

  async listPeriods(tenantId: string): Promise<PayrollPeriod[]> {
    return this.payrollRepository.findPeriodsByTenant(tenantId);
  }

  async listPayrollEmployees(tenantId: string) {
    const relationships = await this.employmentRepository.findByTenant(tenantId, 'ACTIVE');
    const snapshots = await Promise.all(relationships.map((relationship) =>
      this.snapshotResolver.resolve({
        relationshipId: relationship.id,
        employeeId: relationship.employeeId,
        effectiveDate: new Date(),
      }),
    ));
    return snapshots.filter((snapshot) => snapshot !== null);
  }

  async findPayslips(periodId: string): Promise<Payslip[]> {
    return this.payrollRepository.findPayslipsByPeriod(periodId);
  }

  findPayslipById(id: string, tenantId: string): Promise<Payslip | null> {
    return this.payrollRepository.findPayslipById(id, tenantId);
  }

  listConcepts(tenantId: string) {
    return this.payrollRepository.findPayrollConcepts(tenantId);
  }

  async createConcept(data: CreatePayrollConceptData) {
    this.validateConcept(data);
    return this.payrollRepository.createPayrollConcept(data);
  }

  async updateConcept(
    id: string,
    tenantId: string,
    data: UpdatePayrollConceptData,
  ) {
    if (data.amount !== undefined && (!Number.isFinite(data.amount) || data.amount < 0)) {
      throw new Error('Concept amount must be a non-negative number');
    }
    return this.payrollRepository.updatePayrollConcept(id, tenantId, data);
  }

  async addInput(data: {
    tenantId: string;
    periodId: string;
    relationshipId: string;
    conceptId: string;
    amount: number;
    description?: string;
  }) {
    const [period, relationship, concept] = await Promise.all([
      this.payrollRepository.findPeriodById(data.periodId),
      this.employmentRepository.findById(data.relationshipId),
      this.payrollRepository.findPayrollConceptById(data.conceptId, data.tenantId),
    ]);
    if (!period || period.tenantId !== data.tenantId) throw new Error('Payroll period not found');
    if (period.status !== 'OPEN') throw new Error('Payroll inputs can only be added to an open period');
    if (!relationship || relationship.tenantId !== data.tenantId || relationship.status !== 'ACTIVE') {
      throw new Error('Active employment relationship not found');
    }
    if (!concept || !concept.isActive) throw new Error('Active payroll concept not found');
    if (!Number.isFinite(data.amount) || data.amount < 0) {
      throw new Error('Payroll input amount must be a non-negative number');
    }
    const snapshot = await this.snapshotResolver.resolve({
      relationshipId: relationship.id,
      employeeId: relationship.employeeId,
      effectiveDate: period.endDate,
    });
    if (!snapshot) throw new Error('Employee payroll snapshot not found');
    if (concept.currency !== snapshot.currency) {
      throw new Error('Payroll concept currency does not match the employee salary');
    }
    return this.payrollRepository.createPayrollInput(data);
  }

  async updateInput(
    id: string,
    data: {
      tenantId: string;
      periodId: string;
      amount: number;
      description?: string;
    },
  ) {
    const period = await this.payrollRepository.findPeriodById(data.periodId);
    if (!period || period.tenantId !== data.tenantId) throw new Error('Payroll period not found');
    if (period.status !== 'OPEN') throw new Error('Payroll inputs can only be updated in an open period');
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error('Payroll input amount must be positive');
    }
    const input = await this.payrollRepository.updatePayrollInput(
      id,
      data.tenantId,
      data.periodId,
      { amount: data.amount, description: data.description?.trim() || null },
    );
    if (!input) throw new Error('Payroll input not found');
    return input;
  }

  listInputs(periodId: string) {
    return this.payrollRepository.findPayrollInputsByPeriod(periodId);
  }

  async createLoan(data: CreateEmployeeLoanData) {
    const relationship = await this.employmentRepository.findById(data.relationshipId);
    if (!relationship || relationship.tenantId !== data.tenantId || relationship.status !== 'ACTIVE') {
      throw new Error('Active employment relationship not found');
    }
    const snapshot = await this.snapshotResolver.resolve({
      relationshipId: relationship.id,
      employeeId: relationship.employeeId,
      effectiveDate: new Date(),
    });
    if (!snapshot) throw new Error('Employee payroll snapshot not found');
    const normalizeCurrency = (currency: string) =>
      currency === 'VED' ? 'VES' : currency.toUpperCase();
    if (normalizeCurrency(data.currency) !== normalizeCurrency(snapshot.currency)) {
      throw new Error('Loan currency must match the employee salary currency');
    }
    if (
      !Number.isFinite(data.principal) ||
      data.principal <= 0 ||
      !Number.isInteger(data.installmentCount) ||
      data.installmentCount < 1 ||
      data.installmentCount > 1000 ||
      !data.currency.trim() ||
      !data.reason.trim()
    ) {
      throw new Error('Loan amount, installment count, currency, and reason are required');
    }
    const installmentAmount = Math.round((data.principal / data.installmentCount + Number.EPSILON) * 100) / 100;
    return this.payrollRepository.createEmployeeLoan({ ...data, installmentAmount });
  }

  listLoans(tenantId: string, relationshipId?: string) {
    return this.payrollRepository.findEmployeeLoans(tenantId, relationshipId);
  }

  private validateConcept(data: CreatePayrollConceptData) {
    if (!/^[A-Z0-9_-]{2,30}$/.test(data.code)) throw new Error('Concept code must use 2-30 uppercase letters, digits, _ or -');
    if (!data.name.trim() || !data.currency.trim()) throw new Error('Concept name and currency are required');
    if (!Number.isFinite(data.amount) || data.amount < 0) throw new Error('Concept amount must be non-negative');
    if (data.calculationMode === 'BASE_PERCENTAGE' && data.amount > 1000) {
      throw new Error('Percentage concepts cannot exceed 1000%');
    }
  }

  private aggregatePayslipPayments(payslips: Payslip[]) {
    return Array.from(
      payslips.reduce((totals, payslip) => {
        totals.set(payslip.currency, (totals.get(payslip.currency) ?? 0) + payslip.netPay);
        return totals;
      }, new Map<string, number>()),
      ([currency, amount]) => ({
        currency,
        amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      }),
    ).filter((payment) => payment.amount > 0);
  }
}
