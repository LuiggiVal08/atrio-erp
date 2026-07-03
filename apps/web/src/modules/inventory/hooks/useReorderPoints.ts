import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface ReorderPoint {
  id: string;
  productId: string;
  warehouseId: string;
  minQuantity: number;
  maxQuantity: number;
  createdAt: string;
}

export function useReorderPoints() {
  return useQuery<ReorderPoint[]>({
    queryKey: ['reorder-points'],
    queryFn: async () => {
      const res = await api.get('/inventory/reorder-points');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useLowStock() {
  return useQuery<ReorderPoint[]>({
    queryKey: ['reorder-points', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/inventory/reorder-points/low-stock');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}
