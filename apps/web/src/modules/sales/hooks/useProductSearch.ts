import { keepPreviousData, useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import type { ProductSearchResult } from '../store/pos-store';

export function useProductSearch(query: string) {
  return useQuery<ProductSearchResult[]>({
    queryKey: ['product-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const params = new URLSearchParams({ search: query, limit: '20' });
      const res = await api.get(`/inventory/products?${params}`);
      const products = res.data?.data || res.data?.items || res.data || [];
      return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.unitPrice ?? p.price ?? 0,
      }));
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
