export type PayrollLineType = 'EARNING' | 'DEDUCTION';

export interface PayrollCalculationLine {
  type: PayrollLineType;
  amount: number;
}

export interface PayrollTotals {
  baseEarnings: number;
  otherEarnings: number;
  totalDeductions: number;
  netPay: number;
}

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

function assertValidPeriod(startDate: Date, endDate: Date) {
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate.getTime() < startDate.getTime()
  ) {
    throw new Error('Payroll period end must be on or after start');
  }
}

export function prorateMonthlySalary(monthlySalary: number, startDate: Date, endDate: Date): number {
  assertValidPeriod(startDate, endDate);
  if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
    throw new Error('Monthly salary must be a non-negative number');
  }

  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  let total = 0;

  for (
    let month = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
    month <= end;
    month = Date.UTC(new Date(month).getUTCFullYear(), new Date(month).getUTCMonth() + 1, 1)
  ) {
    const monthStart = month;
    const monthEnd = Date.UTC(new Date(month).getUTCFullYear(), new Date(month).getUTCMonth() + 1, 0);
    const segmentStart = Math.max(start, monthStart);
    const segmentEnd = Math.min(end, monthEnd);
    const daysWorked = Math.floor((segmentEnd - segmentStart) / 86_400_000) + 1;
    const daysInMonth = new Date(monthEnd).getUTCDate();
    total += monthlySalary * daysWorked / daysInMonth;
  }

  return roundMoney(total);
}

export function calculatePayrollTotals(
  monthlySalary: number,
  periodStart: Date,
  periodEnd: Date,
  lines: PayrollCalculationLine[],
): PayrollTotals {
  const baseEarnings = prorateMonthlySalary(monthlySalary, periodStart, periodEnd);
  for (const line of lines) {
    if (!Number.isFinite(line.amount) || line.amount < 0) {
      throw new Error('Payroll line amount must be non-negative');
    }
  }

  const otherEarnings = roundMoney(
    lines.filter(line => line.type === 'EARNING').reduce((total, line) => total + line.amount, 0),
  );
  const totalDeductions = roundMoney(
    lines.filter(line => line.type === 'DEDUCTION').reduce((total, line) => total + line.amount, 0),
  );
  const grossEarnings = roundMoney(baseEarnings + otherEarnings);
  if (totalDeductions > grossEarnings) {
    throw new Error('Deductions cannot exceed gross earnings');
  }

  return {
    baseEarnings,
    otherEarnings,
    totalDeductions,
    netPay: roundMoney(grossEarnings - totalDeductions),
  };
}
