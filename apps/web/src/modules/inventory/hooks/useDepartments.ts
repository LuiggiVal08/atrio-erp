import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

function useTenantId() {
  return useTenantStore.getState().activeTenantId;
}

export function useDepartments() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['departments', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/departments`);
      return res.data as Department[];
    },
    enabled: !!tenantId,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      const res = await api.post(`/tenants/${tenantId}/departments`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; code?: string; isActive?: boolean }) => {
      const res = await api.patch(`/departments/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}
