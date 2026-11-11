import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface CashMovement {
  id: string;
  type: 'in' | 'out';
  amount: number;
  description?: string;
  createdAt: string;
}

interface CreateMovementInput {
  type: 'in' | 'out';
  amount: number;
  currency?: string;
  exchangeRate?: number;
  description?: string;
  category?: string;
  receiptName?: string;
}

export function useCashMovements(registerId: string) {
  return useQuery<CashMovement[]>({
    queryKey: ['cash-movements', registerId],
    queryFn: async () => {
      const res = await api.get(`/cash-payments/registers/${registerId}/movements`);
      return res.data?.data || res.data?.items || res.data || [];
    },
    enabled: !!registerId,
  });
}

export function useCreateCashMovement(registerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMovementInput) => {
      const res = await api.post(`/cash-payments/registers/${registerId}/movements`, input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-movements', registerId] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-detail', registerId] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    },
  });
}
