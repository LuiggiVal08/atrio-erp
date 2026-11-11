import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'digital' | 'card' | 'other';
}

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await api.get('/cash-payments/payment-methods');
      return res.data;
    },
  });
}
