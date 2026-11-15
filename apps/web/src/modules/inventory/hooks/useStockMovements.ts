import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { listQueryOptions, txQueryOptions } from '@/core/lib/query-defaults';

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
  userId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  lotId?: string;
  userName?: string;
}

export interface StockBalance {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  updatedAt: string;
  product: {
    id: string; name: string; sku: string; minStock?: number; maxStock?: number | null;
    reorderPoint?: number; baseUnit?: string; purchaseUnit?: string | null; conversionFactor?: number;
    supplierSku?: string | null; unitPrice?: number; costPrice?: number;
  };
  warehouse: { id: string; name: string; code: string | null; branchId: string | null };
}

export interface MovementFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  warehouseId?: string;
  branchId?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MovementPage {
  items: Array<StockMovement & {
    product?: { id: string; name: string; sku: string };
    warehouse?: { id: string; name: string; code: string | null; branchId: string | null };
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export function useStockMovements(productId: string, warehouseId: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<StockMovement[]>({
    queryKey: ['stock-movements', tenantId, productId, warehouseId],
    queryFn: async ({ signal }) => (await api.get(`/inventory/stock/${productId}/${warehouseId}/movements`, { signal })).data,
    enabled: !!tenantId && !!productId && !!warehouseId,
    ...txQueryOptions(),
  });
}

export function useStockBalances() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<StockBalance[]>({
    queryKey: ['stock-balances', tenantId],
    queryFn: async ({ signal }) => (await api.get('/inventory/stock', { signal })).data,
    enabled: !!tenantId,
    ...txQueryOptions(),
  });
}

export function useAllStockMovements(filters: MovementFilters = {}) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<MovementPage>({
    queryKey: ['stock-movements-all', tenantId, filters],
    queryFn: async ({ signal }) => (await api.get('/inventory/stock/movements', { params: filters, signal })).data,
    enabled: !!tenantId,
    ...listQueryOptions(txQueryOptions()),
  });
}

export interface AdjustStockInput {
  productId: string; warehouseId: string; type: 'in' | 'out'; quantity: number; reason: string;
  operationId: string; expectedQuantity?: number;
  lotNumber?: string; serialNumber?: string; expirationDate?: string;
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationKey: ['stock-adjustment', tenantId],
    mutationFn: async ({ productId, warehouseId, ...body }: AdjustStockInput) =>
      (await api.post(`/inventory/stock/${productId}/${warehouseId}/adjust`, body)).data,
    onSuccess: () => Promise.all(
      ['stock-balances', 'stock-movements-all', 'stock-movements', 'inventory', 'product', 'reorder-points', 'warehouses'].map(
        (key) => queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    ),
  });
}
