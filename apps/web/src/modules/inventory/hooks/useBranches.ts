import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

export interface Branch {
  id: string;
  tenantId?: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  managerEmployeeId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BranchPayload {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  managerEmployeeId?: string;
}

function unwrap<T>(data: unknown): T {
  const payload = data as { data?: T; items?: T };
  return payload?.data ?? payload?.items ?? (data as T);
}

export function useBranches(includeInactive = false) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Branch[]>({
    ...refQueryOptions(),
    enabled: !!tenantId,
    queryKey: ['branches', tenantId, { includeInactive }],
    queryFn: async () => {
      const res = await api.get('/inventory/branches', {
        params: includeInactive ? { includeInactive: 'true' } : undefined,
      });
      return unwrap<Branch[]>(res.data) ?? [];
    },
  });
}

export function useBranch(id: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Branch>({
    ...refQueryOptions(),
    queryKey: ['branches', tenantId, 'detail', id],
    queryFn: async () => {
      const res = await api.get(`/inventory/branches/${id}`);
      return unwrap<Branch>(res.data);
    },
    enabled: !!tenantId && !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (data: BranchPayload) =>
      (await api.post('/inventory/branches', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Branch> }) =>
      (await api.patch(`/inventory/branches/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/inventory/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
    },
  });
}
