import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface ProductImage {
  id: string;
  url: string;
  originalName: string;
}

export function useProductImages(id: string) {
  return useQuery({
    queryKey: ['product-images', id],
    queryFn: async () => {
      const res = await api.get(`/inventory/products/${id}/images`);
      return res.data as ProductImage[];
    },
    enabled: !!id,
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post(`/inventory/products/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as { imageUrl: string };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, files }: { id: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      const res = await api.post(`/inventory/products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as ProductImage[];
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', id] });
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/products/${id}/image`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProductImageById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileId }: { id: string; fileId: string }) => {
      await api.delete(`/inventory/products/${id}/images/${fileId}`);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', id] });
    },
  });
}
