import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

interface Vendor {
  id: string;
  legalName: string;
  taxId: string;
  email?: string;
  phone?: string;
}

export function useVendors(search?: string) {
  return useQuery<Vendor[]>({
    queryKey: ['vendors', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/client-vendor/vendors${params}`);
      return res.data;
    },
  });
}

export function useVendor(id: string) {
  return useQuery<Vendor>({
    queryKey: ['vendors', id],
    queryFn: async () => {
      const res = await api.get(`/client-vendor/vendors/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
