import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export function useStockMovements(productId: string, warehouseId: string) {
  return useQuery<StockMovement[]>({
    queryKey: ['stock-movements', productId, warehouseId],
    queryFn: async () => {
      const res = await api.get(`/inventory/stock/${productId}/${warehouseId}/movements`);
      return res.data?.data || res.data?.items || res.data || [];
    },
    enabled: !!productId && !!warehouseId,
  });
}
