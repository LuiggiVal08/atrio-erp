import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useInventoryStore } from '../store/inventory-store';

export function useInventoryList() {
  const { page, pageSize, filter, sortColumn, sortDirection, setProducts, setLoading } = useInventoryStore();

  return useQuery({
    queryKey: ['inventory', page, pageSize, filter, sortColumn, sortDirection],
    queryFn: async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          ...(filter && { filter }),
          ...(sortColumn && { sortBy: String(sortColumn), sortDir: sortDirection }),
        });
        const res = await api.get(`/inventory/products?${params}`);
        const data = res.data;
        setProducts(data.items || data.data || [], data.total || data.totalItems || 0);
        return data;
      } finally {
        setLoading(false);
      }
    },
  });
}
