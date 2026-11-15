import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/core/auth/usePermission';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { txQueryOptions, refQueryOptions } from '@/core/lib/query-defaults';

export function useProduct(id: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery({
    queryKey: ['product', id, tenantId],
    ...txQueryOptions(),
    queryFn: async () => {
      const res = await api.get(`/inventory/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useGenerateProductBarcode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/inventory/products/${id}/barcode`)).data,
    onSuccess: (_, id) => Promise.all([
      client.invalidateQueries({ queryKey: ['product', id] }),
      client.invalidateQueries({ queryKey: ['inventory'] }),
    ]),
  });
}

export function useProductBalances(productId: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const canRead = usePermission('inventory:stock:read');
  return useQuery<Array<{ id: string; productId: string; warehouseId: string; quantity: number; warehouse: { name: string } }>>({
    queryKey: ['stock-balances', 'product', tenantId, productId],
    queryFn: async ({ signal }) => {
      const response = await api.get('/inventory/stock', { signal });
      return response.data.filter((row: { productId: string }) => row.productId === productId);
    },
    enabled: !!productId && canRead,
    ...txQueryOptions(),
  });
}

/** Supplier identities from the tenant-scoped compatibility reference endpoint. */
export function useProductSuppliers() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Array<{ id: string; legalName: string }>>({
    queryKey: ['catalog-suppliers', tenantId],
    queryFn: async () => (await api.get('/client-vendor/vendors')).data,
    ...refQueryOptions(),
  });
}

