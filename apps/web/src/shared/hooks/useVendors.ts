import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { listQueryOptions, TRANSACTIONAL_STALE_TIME } from '@/core/lib/query-defaults';

export interface Vendor {
  id: string;
  legalName: string;
  taxId: string;
  email?: string;
  phone?: string;
  commercialName?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  categoryIds?: string[];
  categories?: { id: string; name: string }[];
  contacts?: { id: string; fullName: string; position: string | null; email: string | null; phone: string | null; isPrimary: boolean }[];
}

export interface VendorPage {
  data: Vendor[];
  total: number;
  page: number;
  pageSize: number;
}

export function useVendors(search?: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Vendor[]>({
    queryKey: ['vendors', search, tenantId],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/client-vendor/vendors${params}`);
      return res.data;
    },
    ...listQueryOptions({ staleTime: TRANSACTIONAL_STALE_TIME }),
  });
}

export function useVendorsPage(search: string | undefined, page: number, pageSize: number) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<VendorPage>({
    queryKey: ['vendors', 'page', search, page, pageSize, tenantId],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      const res = await api.get(`/client-vendor/vendors?${params.toString()}`);
      return res.data;
    },
    ...listQueryOptions({ staleTime: TRANSACTIONAL_STALE_TIME }),
  });
}

export function useVendor(id: string) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<Vendor>({
    queryKey: ['vendors', id, tenantId],
    queryFn: async () => {
      const res = await api.get(`/client-vendor/vendors/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
