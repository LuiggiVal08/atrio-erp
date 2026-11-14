import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { listQueryOptions, TRANSACTIONAL_STALE_TIME } from '@/core/lib/query-defaults';

interface CashRegister {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export function useCashRegisters() {
  return useQuery<CashRegister[]>({
    queryKey: ['cash-registers'],
    queryFn: async () => {
      const res = await api.get('/cash-payments/registers');
      return res.data;
    },
    ...listQueryOptions({ staleTime: TRANSACTIONAL_STALE_TIME }),
  });
}
