import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  commissionRate?: number;
  isActive: boolean;
}

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await api.get('/cash-payments/payment-methods');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}
