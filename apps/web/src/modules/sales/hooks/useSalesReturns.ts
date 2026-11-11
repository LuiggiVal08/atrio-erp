import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface SalesReturnLine {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitPrice?: number;
  lotNumber?: string;
  serialNumber?: string;
}

export interface SalesReturn {
  id: string;
  invoiceId: string;
  reason: string;
  reasonCode?: string;
  productCondition?: string;
  destination?: string;
  resolution?: string;
  warehouseId?: string;
  cashRegisterId?: string;
  creditNoteId?: string;
  lines?: SalesReturnLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  refundedAt?: string;
  returnedAt: string;
  createdAt: string;
}

export interface CreateSalesReturnInput {
  invoiceId: string;
  reason: string;
  reasonCode: string;
  productCondition: 'saleable' | 'repair' | 'damaged';
  destination: 'sellable_stock' | 'quarantine' | 'repair' | 'scrap';
  resolution: 'credit_note' | 'refund_cash' | 'refund_card' | 'exchange';
  cashRegisterId?: string;
  warehouseId?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  lines: SalesReturnLine[];
}

export function useSalesReturns() {
  return useQuery<SalesReturn[]>({
    queryKey: ['sales-returns'],
    queryFn: async () => {
      const res = await api.get('/sales/returns');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useCreateSalesReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSalesReturnInput) => {
      const res = await api.post('/sales/returns', input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
    },
  });
}

export function useUpdateSalesReturnStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/sales/returns/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements-all'] });
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
}
