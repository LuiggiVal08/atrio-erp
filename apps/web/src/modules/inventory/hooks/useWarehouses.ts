import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions, txQueryOptions } from '@/core/lib/query-defaults';

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  branchId: string | null;
  code: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WarehouseSummary {
  warehouseId: string;
  skuCount: number;
  totalUnits: number;
  totalValue: number;
  currency: string;
  health: { healthy: number; low: number; out: number; overstock: number };
  categories: Array<{ categoryId: string | null; name: string | null; units: number; value: number }>;
}

function unwrap<T>(data: unknown): T {
  const payload = data as { data?: T; items?: T };
  return (payload?.data ?? payload?.items ?? (data as T));
}

export function useWarehouses(includeInactive = false) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Warehouse[]>({
    ...refQueryOptions(),
    enabled: !!tenantId,
    queryKey: ['warehouses', tenantId, { includeInactive }],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses', {
        params: includeInactive ? { includeInactive: 'true' } : undefined,
      });
      return unwrap<Warehouse[]>(res.data) ?? [];
    },
  });
}

export function useWarehouse(id: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Warehouse>({
    ...refQueryOptions(),
    queryKey: ['warehouses', tenantId, 'detail', id],
    queryFn: async () => {
      const res = await api.get(`/inventory/warehouses/${id}`);
      return unwrap<Warehouse>(res.data);
    },
    enabled: !!tenantId && !!id,
  });
}

export function useWarehouseSummary(id: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<WarehouseSummary>({
    ...txQueryOptions(),
    queryKey: ['warehouses', tenantId, 'summary', id],
    queryFn: async () => {
      const res = await api.get(`/inventory/warehouses/${id}/summary`);
      return unwrap<WarehouseSummary>(res.data);
    },
    enabled: !!tenantId && !!id,
  });
}

export function useDefaultWarehouse() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Warehouse | null>({
    ...refQueryOptions(),
    enabled: !!tenantId,
    queryKey: ['warehouses', tenantId, 'default'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses/default');
      return unwrap<Warehouse | null>(res.data) ?? null;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useSetDefaultWarehouse() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/inventory/warehouses/${id}/default`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
}
