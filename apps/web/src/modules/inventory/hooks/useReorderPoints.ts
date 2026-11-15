import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { listQueryOptions, refQueryOptions, txQueryOptions } from '@/core/lib/query-defaults';

export interface ReorderPoint {
  id: string;
  productId: string;
  warehouseId: string;
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
  createdAt: string;
}

export interface LowStockRow {
  productId: string;
  warehouseId: string;
  currentQuantity: number;
  minQuantity: number;
  maxQuantity?: number | null;
  suggestedQuantity?: number;
  productName?: string;
  productSku?: string;
  warehouseName?: string;
}

export function useReorderPoints() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<ReorderPoint[]>({
    queryKey: ['reorder-points', tenantId],
    queryFn: async ({ signal }) => (await api.get('/inventory/reorder-points', { signal })).data,
    enabled: !!tenantId,
    ...listQueryOptions(refQueryOptions()),
  });
}

export function useLowStock() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<LowStockRow[]>({
    queryKey: ['reorder-points', 'low-stock', tenantId],
    queryFn: async ({ signal }) => (await api.get('/inventory/reorder-points/low-stock', { signal })).data,
    enabled: !!tenantId,
    ...txQueryOptions(),
  });
}

export function useSetReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { productId: string; warehouseId: string; minQuantity: number; maxQuantity: number }) =>
      (await api.post('/inventory/reorder-points', data)).data,
    onSuccess: () => Promise.all(
      ['reorder-points', 'stock-balances', 'warehouses', 'inventory'].map((key) => qc.invalidateQueries({ queryKey: [key] })),
    ),
  });
}

export function useDeleteReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/inventory/reorder-points/${id}`); },
    onSuccess: () => Promise.all(
      ['reorder-points', 'stock-balances', 'warehouses', 'inventory'].map((key) => qc.invalidateQueries({ queryKey: [key] })),
    ),
  });
}
