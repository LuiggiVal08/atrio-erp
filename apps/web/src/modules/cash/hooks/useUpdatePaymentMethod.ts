import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface UpdatePaymentMethodInput {
  id: string;
  data: {
    name: string;
    type: 'cash' | 'digital' | 'card' | 'other';
    currency?: string;
    commissionRate: number | null;
    isActive: boolean;
  };
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdatePaymentMethodInput) => {
      const res = await api.patch(`/cash-payments/payment-methods/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}
