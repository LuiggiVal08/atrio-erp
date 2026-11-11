import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useInventoryStore, type InventoryProduct } from '../store/inventory-store';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';

function mapProduct(item: any): InventoryProduct {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category ?? '',
    stock: item.stock ?? 0,
    unitPrice: item.unitPrice ?? 0,
    averageCost: item.costPrice ?? 0,
    isActive: item.isActive ?? true,
    status: (item.isActive ? 'approved' : 'cancelled') as DocumentStatus,
  };
}

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
          ...(filter && { search: filter }),
          ...(sortColumn && { sortBy: String(sortColumn), sortDir: sortDirection }),
        });
        const res = await api.get(`/inventory/products?${params}`);
        const data = res.data;
        const items = (data.items ?? data.data ?? data ?? []).map(mapProduct);
        const total = data.total ?? data.totalItems ?? items.length;
        setProducts(items, total);
        return data;
      } finally {
        setLoading(false);
      }
    },
  });
}
