import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

export type StorageLocationType = 'AISLE' | 'SHELF' | 'LEVEL' | 'BIN';

export interface StorageLocation {
  id: string;
  tenantId: string;
  warehouseId: string;
  parentId: string | null;
  type: StorageLocationType;
  code: string;
  name: string | null;
  path: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function unwrap<T>(data: unknown): T {
  const payload = data as { data?: T; items?: T };
  return (payload?.data ?? payload?.items ?? (data as T));
}

function locationsKey(tenantId: string | null, warehouseId: string) {
  return ['warehouses', tenantId, 'locations', warehouseId] as const;
}

export function useStorageLocations(warehouseId: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<StorageLocation[]>({
    ...refQueryOptions(),
    queryKey: locationsKey(tenantId, warehouseId),
    queryFn: async () => {
      const res = await api.get(`/inventory/warehouses/${warehouseId}/locations`);
      return unwrap<StorageLocation[]>(res.data) ?? [];
    },
    enabled: !!tenantId && !!warehouseId,
  });
}

export function useCreateStorageLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (data: {
      parentId?: string | null;
      type: StorageLocationType;
      code?: string;
      name?: string;
    }) => (await api.post(`/inventory/warehouses/${warehouseId}/locations`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKey(tenantId, warehouseId) });
    },
  });
}

export function useGenerateStorageLocations(warehouseId: string) {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (data: { aisles: number; shelves: number; levels: number; bins: number }) =>
      (await api.post(`/inventory/warehouses/${warehouseId}/locations/generate`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKey(tenantId, warehouseId) });
    },
  });
}

export function useUpdateStorageLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string | null; isActive?: boolean };
    }) => (await api.patch(`/inventory/locations/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKey(tenantId, warehouseId) });
    },
  });
}

export function useDeleteStorageLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationsKey(tenantId, warehouseId) });
    },
  });
}
