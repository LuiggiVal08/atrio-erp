import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { listQueryOptions, txQueryOptions } from '@/core/lib/query-defaults';

export interface StockTransfer {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: string;
  createdAt: string;
}

export interface CreateTransferInput {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}

export function useTransfers() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<StockTransfer[]>({
    queryKey: ['stock-transfers', tenantId],
    queryFn: async ({ signal }) => (await api.get('/inventory/transfers', { signal })).data,
    enabled: !!tenantId,
    ...listQueryOptions(txQueryOptions()),
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => (await api.post('/inventory/transfers', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }),
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/inventory/transfers/${id}/complete`)).data,
    onSuccess: () => Promise.all(
      ['stock-transfers', 'stock-balances', 'stock-movements-all', 'stock-movements', 'inventory', 'product', 'reorder-points', 'warehouses'].map(
        (key) => queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    ),
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/inventory/transfers/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }),
  });
}
