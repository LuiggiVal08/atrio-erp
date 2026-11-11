import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  userId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  lotId?: string;
  userName?: string;
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

export function useStockBalances() {
  return useQuery<StockBalance[]>({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const res = await api.get('/inventory/stock');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useAllStockMovements() {
  return useQuery<Array<StockMovement & {
    product?: { id: string; name: string; sku: string };
    warehouse?: { id: string; name: string; code: string | null; branchId: string | null };
  }>>({
    queryKey: ['stock-movements-all'],
    queryFn: async () => {
      const res = await api.get('/inventory/stock/movements');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      productId: string; warehouseId: string; type: 'in' | 'out'; quantity: number; reason?: string;
      lotNumber?: string; serialNumber?: string; expirationDate?: string;
    }) => (await api.post(`/inventory/stock/${data.productId}/${data.warehouseId}/adjust`, {
      type: data.type, quantity: data.quantity, reason: data.reason,
      lotNumber: data.lotNumber, serialNumber: data.serialNumber, expirationDate: data.expirationDate,
    })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements-all'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    },
  });
}
