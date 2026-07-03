import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

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
  return useQuery<StockTransfer[]>({
    queryKey: ['stock-transfers'],
    queryFn: async () => {
      const res = await api.get('/inventory/transfers');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const res = await api.post('/inventory/transfers', input);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }); },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/inventory/transfers/${id}/complete`);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }); },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/inventory/transfers/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-transfers'] }); },
  });
}
