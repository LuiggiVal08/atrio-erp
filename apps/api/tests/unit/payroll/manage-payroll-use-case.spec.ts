import { EventEmitter2 } from '@nestjs/event-emitter';
import { CashMovementService } from '../../../src/modules/cash-payments/application/cash-movement.service';
import { EmploymentRepository } from '../../../src/modules/employment/domain/employment.repository.interface';
import { PayrollRepository } from '../../../src/modules/payroll/domain/payroll.repository.interface';
import { PayrollPeriod, Payslip } from '../../../src/modules/payroll/domain/payroll-period.entity';
import { PayrollSnapshotResolver } from '../../../src/modules/payroll/application/payroll-snapshot-resolver';
import { ManagePayrollUseCase } from '../../../src/modules/payroll/application/manage-payroll.use-case';

describe('ManagePayrollUseCase cash payout', () => {
  const period: PayrollPeriod = {
    id: 'period-1',
    tenantId: 'tenant-1',
    startDate: new Date('2026-10-01T00:00:00.000Z'),
    endDate: new Date('2026-10-31T00:00:00.000Z'),
    status: 'LOCKED',
    frequency: 'MONTHLY',
    notes: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  };

  const payslip = (currency: string, netPay: number): Payslip => ({
    id: `slip-${currency}`,
    periodId: period.id,
    relationshipId: `relationship-${currency}`,
    tenantId: period.tenantId,
    employeeId: `employee-${currency}`,
    employeeName: 'Employee',
    employeeNumber: null,
    contractId: null,
    contractType: null,
    compensationAgreementId: null,
    positionAssignmentId: null,
    positionId: null,
    positionName: null,
    departmentId: null,
    departmentName: null,
    currency,
    baseSalary: netPay,
    baseEarnings: netPay,
    otherEarnings: 0,
    totalDeductions: 0,
    netPay,
    periodStart: period.startDate,
    periodEnd: period.endDate,
    createdAt: period.createdAt,
    lines: [],
  });

  function createUseCase(payslips: Payslip[]) {
    const finalizePayout = jest.fn(async (_tx: never) => undefined);
    const repository = {
      findPeriodById: jest.fn().mockResolvedValue(period),
      findPayslipsByPeriod: jest.fn().mockResolvedValue(payslips),
      markPeriodPaidInTransaction: finalizePayout,
    } as unknown as PayrollRepository;
    const cashMovementService = {
      registerPayrollOutflow: jest.fn(async (_data: object, finalize: (tx: never) => Promise<void>) => {
        await finalize({} as never);
        return [];
      }),
    } as unknown as CashMovementService;
    const eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;
    const useCase = new ManagePayrollUseCase(
      repository,
      {} as EmploymentRepository,
      {} as PayrollSnapshotResolver,
      eventEmitter,
      cashMovementService,
    );
    return { useCase, repository, cashMovementService, finalizePayout };
  }

  it('records one cash outflow per currency before marking the period paid', async () => {
    const { useCase, repository, cashMovementService, finalizePayout } = createUseCase([
      payslip('VED', 100),
      payslip('VED', 25.55),
      payslip('USD', 10),
    ]);

    const findPeriod = jest.spyOn(repository, 'findPeriodById')
      .mockResolvedValueOnce(period)
      .mockResolvedValueOnce({ ...period, status: 'PAID' });
    await useCase.payWithCash(period.id, period.tenantId, 'register-1', 'user-1');

    expect(cashMovementService.registerPayrollOutflow).toHaveBeenCalledWith({
      tenantId: period.tenantId,
      cashRegisterId: 'register-1',
      payrollPeriodId: period.id,
      userId: 'user-1',
      payments: [
        { currency: 'VED', amount: 125.55 },
        { currency: 'USD', amount: 10 },
      ],
    }, expect.any(Function));
    expect(finalizePayout).toHaveBeenCalledWith(expect.anything(), period.id, period.tenantId);
    expect(findPeriod).toHaveBeenCalledTimes(2);
  });

  it('rejects cross-tenant periods and periods with no positive net pay', async () => {
    const crossTenant = createUseCase([payslip('VED', 50)]);
    await expect(crossTenant.useCase.payWithCash(period.id, 'other-tenant', 'register-1', 'user-1'))
      .rejects.toThrow('Payroll period not found');
    expect(crossTenant.cashMovementService.registerPayrollOutflow).not.toHaveBeenCalled();

    const empty = createUseCase([payslip('VED', 0)]);
    await expect(empty.useCase.payWithCash(period.id, period.tenantId, 'register-1', 'user-1'))
      .rejects.toThrow('no positive net amounts');
    expect(empty.cashMovementService.registerPayrollOutflow).not.toHaveBeenCalled();
  });
});
