import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface SalaryEntry {
  id: string;
  employeeId: string;
  salary: number;
  currency: string;
  effectiveDate: string;
  notes?: string;
}

export function useSalaryHistory(employeeId: string) {
  return useQuery({
    queryKey: ['salary-history', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/salary-history`);
      return res.data as SalaryEntry[];
    },
    enabled: !!employeeId,
  });
}

export function useCreateSalaryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, ...data }: { employeeId: string; salary: number; currency: string; effectiveDate: string; notes?: string }) => {
      const res = await api.post(`/employees/${employeeId}/salary-history`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['salary-history', variables.employeeId] });
    },
  });
}
