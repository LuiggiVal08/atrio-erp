import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface SalesOrder {
  id: string;
  documentId: string;
  clientId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface CreateSalesOrderInput {
  clientId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency?: string;
  notes?: string;
}

export function useSalesOrders() {
  return useQuery<SalesOrder[]>({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const res = await api.get('/sales/orders');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSalesOrderInput) => {
      const res = await api.post('/sales/orders', {
        documentId: crypto.randomUUID(),
        ...input,
        currency: input.currency ?? 'VED',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}
