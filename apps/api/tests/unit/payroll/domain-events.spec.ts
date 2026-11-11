import {
  payrollPeriodGenerated,
  payrollPeriodLocked,
  payrollPeriodPaid,
  payrollPeriodClosed,
} from '../../../src/modules/payroll/domain/domain-events';

describe('PayrollDomainEvents', () => {
  it('payrollPeriodGenerated should have correct eventType and payslipCount', () => {
    const event = payrollPeriodGenerated('period-1', 't1', 5);
    expect(event.eventType).toBe('payroll.period.generated');
    expect(event.periodId).toBe('period-1');
    expect(event.tenantId).toBe('t1');
    expect(event.timestamp).toBeDefined();
    expect(event.data?.payslipCount).toBe(5);
  });

  it('payrollPeriodLocked should have correct eventType and payslipCount', () => {
    const event = payrollPeriodLocked('period-1', 't1', 3);
    expect(event.eventType).toBe('payroll.period.locked');
    expect(event.periodId).toBe('period-1');
    expect(event.tenantId).toBe('t1');
    expect(event.timestamp).toBeDefined();
    expect(event.data?.payslipCount).toBe(3);
  });

  it('payrollPeriodPaid should have correct eventType', () => {
    const event = payrollPeriodPaid('period-1', 't1');
    expect(event.eventType).toBe('payroll.period.paid');
    expect(event.periodId).toBe('period-1');
    expect(event.tenantId).toBe('t1');
    expect(event.timestamp).toBeDefined();
    expect(event.data).toBeUndefined();
  });

  it('payrollPeriodClosed should have correct eventType', () => {
    const event = payrollPeriodClosed('period-1', 't1');
    expect(event.eventType).toBe('payroll.period.closed');
    expect(event.periodId).toBe('period-1');
    expect(event.tenantId).toBe('t1');
    expect(event.timestamp).toBeDefined();
    expect(event.data).toBeUndefined();
  });
});
