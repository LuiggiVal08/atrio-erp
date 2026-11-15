import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { txQueryOptions } from '@/core/lib/query-defaults';

export interface InventorySummary {
  totalProducts: number;
  stockHealth: { healthy: number; low: number; out: number; overstock: number };
  valuation: {
    currency: string;
    totalValue: number;
    categories: Array<{ categoryId: string | null; name: string | null; value: number }>;
  };
  coverage: {
    periodDays: number;
    medianDays: number | null;
    under7: number;
    from7to30: number;
    over30: number;
    noSales: number;
  };
}

export function useInventorySummary() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery({
    queryKey: ['inventory', 'summary', tenantId],
    ...txQueryOptions(),
    queryFn: async (): Promise<InventorySummary> => {
      const res = await api.get('/inventory/products/summary');
      return res.data;
    },
  });
}
