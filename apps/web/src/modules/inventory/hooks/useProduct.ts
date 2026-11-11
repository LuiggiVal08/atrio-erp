import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/inventory/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
