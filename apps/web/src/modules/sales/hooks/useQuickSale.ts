import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface QuickSaleInput {
  clientId: string;
  cashRegisterId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency?: string;
  notes?: string;
  paymentMethod: string;
  items: Array<{
    productId: string;
    warehouseId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export function useQuickSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QuickSaleInput) => {
      const res = await api.post('/pos/quick-sale', input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
    },
  });
}
