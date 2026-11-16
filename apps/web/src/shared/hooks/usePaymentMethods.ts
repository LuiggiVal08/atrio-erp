import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'digital' | 'card' | 'other';
}

export function usePaymentMethods() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods', tenantId],
    queryFn: async () => {
      const res = await api.get('/cash-payments/payment-methods');
      return res.data;
    },
    ...refQueryOptions(),
  });
}
