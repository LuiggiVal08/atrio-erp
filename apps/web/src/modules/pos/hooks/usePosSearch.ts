import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface ProductHit {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
}

export function useProductSearch(query: string) {
  return useQuery<ProductHit[]>({
    queryKey: ['pos-product-search', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const params = new URLSearchParams({ search: query, limit: '20' });
      const res = await api.get(`/inventory/products?${params}`);
      const products = res.data?.data || res.data?.items || res.data || [];
      return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku ?? '',
        barcode: p.barcode ?? '',
        price: p.unitPrice ?? p.price ?? 0,
      }));
    },
    enabled: query.length >= 1,
    staleTime: 30_000,
  });
}

export function useCustomerSearch(query: string) {
  return useQuery<Array<{ id: string; name: string; taxId: string }>>({
    queryKey: ['pos-customer-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const params = new URLSearchParams({ search: query, limit: '10' });
      const res = await api.get(`/client-vendor/clients?${params}`);
      const clients = res.data?.data || res.data?.items || res.data || [];
      return clients.map((c: any) => ({
        id: c.id,
        name: c.name || c.businessName || '',
        taxId: c.taxId || c.rif || c.documentId || '',
      }));
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
