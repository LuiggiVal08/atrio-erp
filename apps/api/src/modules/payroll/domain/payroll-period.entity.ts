import { createStateMachine } from '@/common/state-machine/state-machine';

export type PayrollPeriodStatus = 'OPEN' | 'CALCULATING' | 'LOCKED' | 'PAID' | 'CLOSED';
export type PayrollFrequency = 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'CUSTOM';
export type PayrollLineType = 'EARNING' | 'DEDUCTION';
export type PayrollCalculationMode = 'FIXED' | 'BASE_PERCENTAGE';
export type PayrollLineSource = 'BASE' | 'CONCEPT' | 'LOAN' | 'COMMISSION';

export const payrollPeriodStateMachine = createStateMachine<PayrollPeriodStatus>({
  OPEN: ['CALCULATING'],
  CALCULATING: ['LOCKED'],
  LOCKED: ['PAID'],
  PAID: ['CLOSED'],
  CLOSED: [],
});

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  status: PayrollPeriodStatus;
  frequency: PayrollFrequency;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payslip {
  id: string;
  periodId: string;
  relationshipId: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  contractId: string | null;
  contractType: string | null;
  compensationAgreementId: string | null;
  positionAssignmentId: string | null;
  positionId: string | null;
  positionName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  currency: string;
  baseSalary: number;
  baseEarnings: number;
  otherEarnings: number;
  totalDeductions: number;
  netPay: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  lines?: PayslipLine[];
}

export interface PayslipLine {
  id: string;
  payslipId: string;
  type: PayrollLineType;
  source: PayrollLineSource;
  sourceId: string | null;
  conceptId: string | null;
  payrollInputId: string | null;
  loanId: string | null;
  description: string;
  amount: number;
  currency: string;
  createdAt: Date;
}

export interface PayrollConcept {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: PayrollLineType;
  calculationMode: PayrollCalculationMode;
  amount: number;
  currency: string;
  recurring: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollInput {
  id: string;
  tenantId: string;
  periodId: string;
  relationshipId: string;
  conceptId: string;
  amount: number;
  description: string | null;
  createdAt: Date;
  concept?: PayrollConcept;
}

export interface EmployeeLoan {
  id: string;
  tenantId: string;
  relationshipId: string;
  principal: number;
  outstandingBalance: number;
  installmentAmount: number;
  installmentCount: number;
  paidInstallments: number;
  currency: string;
  reason: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayslipSnapshot {
  relationshipId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  contractId: string | null;
  contractType: string | null;
  compensationAgreementId: string;
  positionAssignmentId: string | null;
  positionId: string | null;
  positionName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  currency: string;
  baseSalary: number;
}

export interface PayrollCalculationContext {
  periodStart: Date;
  periodEnd: Date;
  tenantId: string;
}
