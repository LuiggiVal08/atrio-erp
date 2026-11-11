import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface Tenant {
  id: string;
  legalName: string;
  taxId: string;
  baseCurrency: string;
  timezone: string;
  subscriptionPlan: string;
  status: string;
  settings?: Record<string, unknown>;
  enabledModules?: string[];
  createdAt: string;
  updatedAt: string;
}

export function useTenant(id: string | null) {
  return useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const res = await api.get(`/tenants/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateTenant(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Pick<Tenant, 'legalName' | 'taxId' | 'baseCurrency' | 'timezone' | 'settings'>>) => {
      const res = await api.patch(`/admin/tenants/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', id] });
    },
  });
}

export function useTenantModules(id: string | null) {
  return useQuery<{ enabledModules: string[] }>({
    queryKey: ['tenant', id, 'modules'],
    queryFn: async () => {
      const res = await api.get(`/admin/tenants/${id}/modules`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateTenantModules(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabledModules: string[]) => {
      const res = await api.patch(`/admin/tenants/${id}/modules`, { enabledModules });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', id] });
      qc.invalidateQueries({ queryKey: ['tenant', id, 'modules'] });
    },
  });
}
