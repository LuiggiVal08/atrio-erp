import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export function useCategories() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Category[]>({
    queryKey: ['categories', tenantId],
    queryFn: async () => {
      const res = await api.get('/inventory/categories');
      return res.data;
    },
    ...refQueryOptions(),
  });
}
