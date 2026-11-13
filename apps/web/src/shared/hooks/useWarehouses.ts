import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { refQueryOptions } from '@/core/lib/query-defaults';

interface Warehouse {
  id: string;
  name: string;
  isActive: boolean;
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data;
    },
    ...refQueryOptions(),
  });
}
