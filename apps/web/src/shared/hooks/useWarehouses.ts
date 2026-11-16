import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

interface Warehouse {
  id: string;
  name: string;
  isActive: boolean;
}

export function useWarehouses() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses', tenantId],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data;
    },
    ...refQueryOptions(),
  });
}
