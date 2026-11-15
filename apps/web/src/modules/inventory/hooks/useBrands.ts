import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { refQueryOptions } from '@/core/lib/query-defaults';

export interface ProductBrand {
  id: string;
  name: string;
  logoFileId: string | null;
  logoFile?: {
    id: string;
    originalName: string;
    storageKey: string;
    mimeType: string;
  } | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export function useBrands() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useQuery<ProductBrand[]>({
    queryKey: ['brands', tenantId],
    ...refQueryOptions(),
    queryFn: async () => (await api.get('/inventory/brands')).data,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; logoFileId?: string }) =>
      (await api.post('/inventory/brands', data)).data as ProductBrand,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brands'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['product'] }),
    ]),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; logoFileId?: string | null; isActive?: boolean }) =>
      (await api.patch(`/inventory/brands/${id}`, data)).data as ProductBrand,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brands'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['product'] }),
    ]),
  });
}

export function useUploadBrandLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('logo', file);
      return (await api.post(`/inventory/brands/${id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data as ProductBrand;
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brands'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['product'] }),
    ]),
  });
}
