import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      accountNumber: string;
      bankName: string;
      accountType: 'checking' | 'savings' | 'cash';
      currency?: string;
    }) => {
      const res = await api.post('/cash-payments/bank-accounts', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}
