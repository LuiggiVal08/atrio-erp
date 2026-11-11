import {
  EmployeeLoan,
  PayrollConcept,
  PayrollFrequency,
  PayrollInput,
  PayrollPeriod,
  Payslip,
  PayrollPeriodStatus,
  PayrollLineSource,
  PayrollLineType,
} from './payroll-period.entity';
import { Prisma } from '@prisma/client';

export interface PayrollPeriodCreateData {
  tenantId: string;
  startDate: string;
  endDate: string;
  frequency?: PayrollFrequency;
  notes?: string;
}

export interface PayrollLineCreateData {
  type: PayrollLineType;
  source: PayrollLineSource;
  sourceId?: string | null;
  conceptId?: string | null;
  payrollInputId?: string | null;
  loanId?: string | null;
  description: string;
  amount: number;
  currency: string;
}

export interface CreatePayslipData {
  periodId: string;
  tenantId: string;
  relationshipId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
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
  baseEarnings: number;
  otherEarnings: number;
  totalDeductions: number;
  netPay: number;
  periodStart: Date;
  periodEnd: Date;
  lines: PayrollLineCreateData[];
}

export interface CreatePayrollConceptData {
  tenantId: string;
  code: string;
  name: string;
  type: PayrollLineType;
  calculationMode: 'FIXED' | 'BASE_PERCENTAGE';
  amount: number;
  currency: string;
  recurring: boolean;
}

export type UpdatePayrollConceptData = Partial<
  Pick<PayrollConcept, 'name' | 'amount' | 'currency' | 'recurring' | 'isActive'>
>;

export interface CreatePayrollInputData {
  tenantId: string;
  periodId: string;
  relationshipId: string;
  conceptId: string;
  amount: number;
  description?: string;
}

export interface UpdatePayrollInputData {
  amount: number;
  description?: string | null;
}

export interface CreateEmployeeLoanData {
  tenantId: string;
  relationshipId: string;
  principal: number;
  installmentCount: number;
  currency: string;
  reason: string;
}

export interface PersistEmployeeLoanData extends CreateEmployeeLoanData {
  installmentAmount: number;
}

export interface PendingCommission {
  id: string;
  amount: number;
  currency: string;
  description: string;
}

export interface PayrollRepository {
  createPeriod(data: PayrollPeriodCreateData): Promise<PayrollPeriod>;
  findPeriodById(id: string): Promise<PayrollPeriod | null>;
  findPeriodsByTenant(tenantId: string): Promise<PayrollPeriod[]>;
  findOpenPeriodByTenant(tenantId: string): Promise<PayrollPeriod | null>;
  updatePeriodStatus(id: string, status: PayrollPeriodStatus): Promise<PayrollPeriod>;
  transitionPeriodStatus(
    id: string,
    currentStatus: PayrollPeriodStatus,
    nextStatus: PayrollPeriodStatus,
  ): Promise<boolean>;

  createPayslips(periodId: string, data: CreatePayslipData[]): Promise<Payslip[]>;
  findPayslipsByPeriod(periodId: string): Promise<Payslip[]>;
  findPayslipById(id: string, tenantId: string): Promise<Payslip | null>;
  countPayslipsByPeriod(periodId: string): Promise<number>;
  findPayrollConcepts(tenantId: string): Promise<PayrollConcept[]>;
  findPayrollConceptById(id: string, tenantId: string): Promise<PayrollConcept | null>;
  createPayrollConcept(data: CreatePayrollConceptData): Promise<PayrollConcept>;
  updatePayrollConcept(
    id: string,
    tenantId: string,
    data: UpdatePayrollConceptData,
  ): Promise<PayrollConcept | null>;
  createPayrollInput(data: CreatePayrollInputData): Promise<PayrollInput>;
  updatePayrollInput(
    id: string,
    tenantId: string,
    periodId: string,
    data: UpdatePayrollInputData,
  ): Promise<PayrollInput | null>;
  findPayrollInputsByPeriod(periodId: string): Promise<PayrollInput[]>;
  createEmployeeLoan(data: PersistEmployeeLoanData): Promise<EmployeeLoan>;
  findEmployeeLoans(tenantId: string, relationshipId?: string): Promise<EmployeeLoan[]>;
  findActiveEmployeeLoans(tenantId: string, relationshipId: string): Promise<EmployeeLoan[]>;
  findPendingCommissions(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PendingCommission[]>;
  markCommissionsPaid(ids: string[]): Promise<void>;
  markPeriodPaidInTransaction(
    tx: Prisma.TransactionClient,
    periodId: string,
    tenantId: string,
  ): Promise<void>;
}
