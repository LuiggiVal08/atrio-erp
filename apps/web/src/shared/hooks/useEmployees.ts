import { useQuery } from '@tanstack/react-query';
import { useTenantStore } from '@/core/tenant/store';
import api from '@/shared/lib/api/client';

export interface EmployeeOption {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  status?: string;
  deletedAt?: string | null;
}

function unwrap<T>(data: unknown): T {
  const payload = data as { data?: T; items?: T };
  return payload?.data ?? payload?.items ?? (data as T);
}

export function employeeDisplayName(employee: EmployeeOption): string {
  return [employee.firstName, employee.middleName, employee.lastName, employee.secondLastName]
    .filter(Boolean)
    .join(' ');
}

export function useEmployees() {
  const tenantId = useTenantStore((state) => state.activeTenantId);

  return useQuery<EmployeeOption[]>({
    queryKey: ['employees', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/employees`);
      const employees = unwrap<EmployeeOption[]>(res.data) ?? [];
      return employees.filter((employee) => !employee.deletedAt);
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });
}
