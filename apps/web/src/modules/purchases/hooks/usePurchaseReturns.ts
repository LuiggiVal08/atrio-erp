import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PurchaseReturn {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  reason: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  returnedAt: string;
  reasonCode?: string;
  resolution?: string;
  supplierCreditNo?: string;
  warehouseId?: string;
  lines?: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }>;
  createdAt: string;
  updatedAt: string;
}

export function usePurchaseReturns() {
  return useQuery<PurchaseReturn[]>({
    queryKey: ['purchase-returns'],
    queryFn: async () => {
      const res = await api.get('/purchasing/returns');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function usePurchaseReturn(id: string | undefined) {
  return useQuery<PurchaseReturn>({
    queryKey: ['purchase-returns', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/purchasing/returns/${id}`);
      return res.data?.data || res.data;
    },
  });
}

export function useCreatePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, ...data }: {
      orderId: string; reason: string; reasonCode?: string; resolution?: string; supplierCreditNo?: string; warehouseId?: string;
      subtotal: number; taxAmount: number; total: number;
      lines: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }>;
    }) => {
      const res = await api.post(`/purchasing/orders/${orderId}/return`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useUpdatePurchaseReturnStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/purchasing/returns/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
    },
  });
}

export function useDeletePurchaseReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/purchasing/returns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
    },
  });
}
