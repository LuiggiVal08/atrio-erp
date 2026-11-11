import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

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
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  productName?: string;
  productSku?: string;
  warehouseName?: string;
}

const listKey = ['reorder-points'];

export function useReorderPoints() {
  return useQuery<ReorderPoint[]>({
    queryKey: listKey,
    queryFn: async () => {
      const res = await api.get('/inventory/reorder-points');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useLowStock() {
  return useQuery<LowStockRow[]>({
    queryKey: ['reorder-points', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/inventory/reorder-points/low-stock');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useSetReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { productId: string; warehouseId: string; minQuantity: number; maxQuantity: number }) => {
      const res = await api.post('/inventory/reorder-points', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });
}

export function useDeleteReorderPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/reorder-points/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });
}
