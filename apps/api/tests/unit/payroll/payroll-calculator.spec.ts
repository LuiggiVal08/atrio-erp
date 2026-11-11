import { calculatePayrollTotals, prorateMonthlySalary } from '../../../src/modules/payroll/domain/payroll-calculator';

describe('payroll calculation', () => {
  it('prorates a monthly salary by calendar days in each month', () => {
    expect(prorateMonthlySalary(3100, new Date('2026-10-16T00:00:00.000Z'), new Date('2026-10-31T00:00:00.000Z'))).toBe(1600);
  });

  it('combines earnings and deductions into a non-negative net amount', () => {
    expect(calculatePayrollTotals(3000, new Date('2026-10-01T00:00:00.000Z'), new Date('2026-10-31T00:00:00.000Z'), [
      { type: 'EARNING', amount: 125.25 },
      { type: 'DEDUCTION', amount: 25.25 },
    ])).toEqual({
      baseEarnings: 3000,
      otherEarnings: 125.25,
      totalDeductions: 25.25,
      netPay: 3100,
    });
  });

  it('rejects deductions that exceed gross earnings instead of producing a negative payslip', () => {
    expect(() => calculatePayrollTotals(
      100,
      new Date('2026-10-01T00:00:00.000Z'),
      new Date('2026-10-31T00:00:00.000Z'),
      [{ type: 'DEDUCTION', amount: 125 }],
    )).toThrow('Deductions cannot exceed gross earnings');
  });

  it('rejects invalid date ranges and negative line amounts', () => {
    expect(() => prorateMonthlySalary(
      1000,
      new Date('2026-10-10T00:00:00.000Z'),
      new Date('2026-10-01T00:00:00.000Z'),
    )).toThrow('Payroll period end must be on or after start');
    expect(() => calculatePayrollTotals(
      1000,
      new Date('2026-10-01T00:00:00.000Z'),
      new Date('2026-10-31T00:00:00.000Z'),
      [{ type: 'EARNING', amount: -1 }],
    )).toThrow('Payroll line amount must be non-negative');
  });
});
