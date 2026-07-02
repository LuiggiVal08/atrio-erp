import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface PurchaseOrder {
  id: string;
  documentId: string;
  vendorId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
  expectedDate?: string;
  createdAt: string;
}

interface CreatePurchaseOrderInput {
  vendorId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency?: string;
  notes?: string;
  expectedDate?: string;
}

export function usePurchaseOrders() {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/purchasing/orders');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePurchaseOrderInput) => {
      const res = await api.post('/purchasing/orders', {
        documentId: crypto.randomUUID(),
        ...input,
        currency: input.currency ?? 'VED',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/purchasing/orders/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lines }: { id: string; lines: Array<{ lineId: string; quantity: number }> }) => {
      const res = await api.patch(`/purchasing/orders/${id}/receive`, { lines });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}
