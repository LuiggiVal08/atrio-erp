import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

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
  return useQuery<ProductBrand[]>({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/inventory/brands')).data,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; logoFileId?: string }) =>
      (await api.post('/inventory/brands', data)).data as ProductBrand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; logoFileId?: string | null; isActive?: boolean }) =>
      (await api.patch(`/inventory/brands/${id}`, data)).data as ProductBrand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });
}
