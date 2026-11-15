import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { listQueryOptions, TRANSACTIONAL_STALE_TIME } from '@/core/lib/query-defaults';

export interface Client {
  id: string;
  legalName: string;
  documentId?: string;
  taxId: string;
  email?: string;
  phone?: string;
}

export interface ClientPage {
  data: Client[];
  total: number;
  page: number;
  pageSize: number;
}

export function useClients(search?: string) {
  return useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/client-vendor/clients${params}`);
      return res.data;
    },
    ...listQueryOptions({ staleTime: TRANSACTIONAL_STALE_TIME }),
  });
}

export function useClientsPage(search: string | undefined, page: number, pageSize: number) {
  return useQuery<ClientPage>({
    queryKey: ['clients', 'page', search, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      const res = await api.get(`/client-vendor/clients?${params.toString()}`);
      return res.data;
    },
    ...listQueryOptions({ staleTime: TRANSACTIONAL_STALE_TIME }),
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const res = await api.get(`/client-vendor/clients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
