import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateCashRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; location?: string }) => {
      const res = await api.post('/cash-payments/registers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    },
  });
}
