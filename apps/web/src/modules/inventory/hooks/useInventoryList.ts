import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { useInventoryStore, type InventoryProduct } from '../store/inventory-store';
import { listQueryOptions } from '@/core/lib/query-defaults';
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

function mapItems(data: any): { items: InventoryProduct[]; total: number } {
  const items = (data.items ?? data.data ?? data ?? []).map(mapProduct);
  const total = data.total ?? data.totalItems ?? items.length;
  return { items, total };
}

export function useInventoryList() {
  const { page, pageSize, filter, sortColumn, sortDirection } = useInventoryStore();
  const deferredFilter = useDeferredValue(filter);
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const supportedSort = sortColumn === 'averageCost' ? 'costPrice' :
    ['sku', 'name', 'unitPrice'].includes(sortColumn ?? '') ? sortColumn : null;

  const query = useQuery({
    queryKey: ['inventory', 'list', tenantId, page, pageSize, deferredFilter, supportedSort, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(deferredFilter && { search: deferredFilter }),
        ...(supportedSort && { sortBy: supportedSort, sortDir: sortDirection }),
      });
      const res = await api.get(`/inventory/products?${params}`);
      return mapItems(res.data);
    },
    ...listQueryOptions(),
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
  };
}

export function useInventoryProducts() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<InventoryProduct[]>({
    queryKey: ['inventory', 'products', 'all', tenantId],
    ...listQueryOptions(),
    queryFn: async () => {
      const res = await api.get('/inventory/products?pageSize=1000');
      return mapItems(res.data).items;
    },
  });
}
