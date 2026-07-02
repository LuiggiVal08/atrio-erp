import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface Client {
  id: string;
  legalName: string;
  taxId: string;
  email?: string;
  phone?: string;
}

export function useClients(search?: string) {
  return useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/client-vendor/clients${params}`);
      return res.data;
    },
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
