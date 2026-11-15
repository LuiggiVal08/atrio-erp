import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: string;
  country: string;
  isActive: boolean;
}

export function useTaxes() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery({
    queryKey: ['taxes', tenantId],
    ...refQueryOptions(),
    queryFn: async () => {
      const res = await api.get('/localization/taxes');
      return res.data as Tax[];
    },
  });
}

export function useCreateTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; rate: number; type: 'percentage' | 'fixed' }) => {
      const res = await api.post('/localization/taxes', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxes'] }),
  });
}

export function useDeleteTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/localization/taxes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taxes'] }),
  });
}
