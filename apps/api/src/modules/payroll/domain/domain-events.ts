export interface PayrollDomainEvent {
  eventType: string;
  periodId: string;
  tenantId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export function payrollPeriodGenerated(
  periodId: string, tenantId: string, payslipCount: number,
): PayrollDomainEvent {
  return {
    eventType: 'payroll.period.generated',
    periodId,
    tenantId,
    timestamp: new Date().toISOString(),
    data: { payslipCount },
  };
}

export function payrollPeriodLocked(
  periodId: string, tenantId: string, payslipCount: number,
): PayrollDomainEvent {
  return {
    eventType: 'payroll.period.locked',
    periodId,
    tenantId,
    timestamp: new Date().toISOString(),
    data: { payslipCount },
  };
}

export function payrollPeriodPaid(
  periodId: string, tenantId: string,
): PayrollDomainEvent {
  return {
    eventType: 'payroll.period.paid',
    periodId,
    tenantId,
    timestamp: new Date().toISOString(),
  };
}

export function payrollPeriodClosed(
  periodId: string, tenantId: string,
): PayrollDomainEvent {
  return {
    eventType: 'payroll.period.closed',
    periodId,
    tenantId,
    timestamp: new Date().toISOString(),
  };
}
