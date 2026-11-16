import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { listQueryOptions, TRANSACTIONAL_STALE_TIME } from '@/core/lib/query-defaults';

interface CashRegister {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export function useCashRegisters() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<CashRegister[]>({
    queryKey: ['cash-registers', tenantId],
    queryFn: async () => {
      const res = await api.get('/cash-payments/registers');
      return res.data;
    },
    ...listQueryOptions({ staleTime: TRANSACTIONAL_STALE_TIME }),
  });
}
