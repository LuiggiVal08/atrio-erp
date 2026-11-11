import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CALCULATING' | 'LOCKED' | 'PAID' | 'CLOSED';
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'CUSTOM';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  periodId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string | null;
  baseSalary: number;
  baseEarnings: number;
  otherEarnings: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  contractType?: string | null;
  positionName?: string | null;
  departmentName?: string | null;
  lines?: PayslipLine[];
}

export interface PayslipLine {
  id: string;
  type: 'EARNING' | 'DEDUCTION';
  source: 'BASE' | 'CONCEPT' | 'LOAN' | 'COMMISSION';
  description: string;
  amount: number;
  currency: string;
}

export interface PayrollConcept {
  id: string;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationMode: 'FIXED' | 'BASE_PERCENTAGE';
  amount: number;
  currency: string;
  recurring: boolean;
  isActive: boolean;
}

export interface PayrollEmployee {
  relationshipId: string;
  employeeId: string;
  employeeName: string;
  currency: string;
}

export interface PayrollInput {
  id: string;
  relationshipId: string;
  conceptId: string;
  amount: number;
  description?: string | null;
  concept?: PayrollConcept;
}

export interface EmployeeLoan {
  id: string;
  relationshipId: string;
  principal: number;
  outstandingBalance: number;
  installmentAmount: number;
  installmentCount: number;
  paidInstallments: number;
  currency: string;
  reason: string;
  isActive: boolean;
}

export function usePayrolls() {
  return useQuery<PayrollPeriod[]>({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      const res = await api.get('/payroll/periods');
      return res.data;
    },
  });
}

export function usePayrollPeriod(id: string) {
  return useQuery<PayrollPeriod>({
    queryKey: ['payroll-period', id],
    queryFn: async () => {
      const res = await api.get(`/payroll/periods/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function usePayslips(periodId: string) {
  return useQuery<Payslip[]>({
    queryKey: ['payslips', periodId],
    queryFn: async () => {
      const res = await api.get(`/payroll/periods/${periodId}/payslips`);
      return res.data;
    },
    enabled: !!periodId,
  });
}

export function useDownloadPayslipReceipt() {
  return useMutation({
    mutationFn: async (payslipId: string) => {
      const { data } = await api.get(`/payroll/payslips/${payslipId}/receipt`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      startDate: string;
      endDate: string;
      frequency?: PayrollPeriod['frequency'];
      notes?: string;
    }) => {
      const res = await api.post('/payroll/periods', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });
}

export function useGeneratePayslips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/payroll/periods/${id}/generate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });
}

export function usePayPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data:
        | { id: string; method: 'cash'; cashRegisterId: string }
        | { id: string; method: 'bank'; bankAccountId: string },
    ) => {
      const { id, ...payment } = data;
      const res = await api.post(`/payroll/periods/${id}/pay`, payment);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useClosePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/payroll/periods/${id}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-period'] });
    },
  });
}

export function usePayrollConcepts() {
  return useQuery<PayrollConcept[]>({
    queryKey: ['payroll-concepts'],
    queryFn: async () => (await api.get('/payroll/concepts')).data,
  });
}

export function usePayrollEmployees() {
  return useQuery<PayrollEmployee[]>({
    queryKey: ['payroll-employees'],
    queryFn: async () => (await api.get('/payroll/employees')).data,
  });
}

export function useCreatePayrollConcept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PayrollConcept, 'id' | 'isActive'>) =>
      (await api.post('/payroll/concepts', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll-concepts'] }),
  });
}

export function useUpdatePayrollConcept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PayrollConcept> & { id: string }) =>
      (await api.patch(`/payroll/concepts/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll-concepts'] }),
  });
}

export function usePayrollInputs(periodId: string) {
  return useQuery<PayrollInput[]>({
    queryKey: ['payroll-inputs', periodId],
    queryFn: async () => (await api.get(`/payroll/periods/${periodId}/inputs`)).data,
    enabled: !!periodId,
  });
}

export function useAddPayrollInput(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { relationshipId: string; conceptId: string; amount: number; description?: string }) =>
      (await api.post(`/payroll/periods/${periodId}/inputs`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll-inputs', periodId] }),
  });
}

export function useUpdatePayrollInput(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; amount: number; description?: string }) =>
      (await api.patch(`/payroll/periods/${periodId}/inputs/${data.id}`, {
        amount: data.amount,
        description: data.description,
      })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll-inputs', periodId] }),
  });
}

export function useEmployeeLoans(relationshipId?: string) {
  return useQuery<EmployeeLoan[]>({
    queryKey: ['employee-loans', relationshipId],
    queryFn: async () => (await api.get('/payroll/loans', {
      params: relationshipId ? { relationshipId } : undefined,
    })).data,
  });
}

export function useCreateEmployeeLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      relationshipId: string;
      principal: number;
      installmentCount: number;
      currency: string;
      reason: string;
    }) => (await api.post('/payroll/loans', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-loans'] }),
  });
}
