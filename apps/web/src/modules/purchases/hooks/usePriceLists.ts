import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PriceList {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  currency: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  unitPrice: number;
  currency: string;
  minQuantity?: number;
}

export interface CreatePriceListInput {
  name: string;
  type: string;
  currency?: string;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface UpdatePriceListInput {
  name?: string;
  type?: string;
  currency?: string;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export function usePriceLists() {
  return useQuery<PriceList[]>({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const res = await api.get('/purchasing/price-lists');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function usePriceList(id: string | undefined) {
  return useQuery<PriceList>({
    queryKey: ['price-lists', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/purchasing/price-lists/${id}`);
      return res.data?.data || res.data;
    },
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePriceListInput) => {
      const res = await api.post('/purchasing/price-lists', {
        ...input,
        currency: input.currency ?? 'VED',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdatePriceListInput) => {
      const res = await api.patch(`/purchasing/price-lists/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function useDeletePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/purchasing/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function usePriceListItems(priceListId: string | undefined) {
  return useQuery<PriceListItem[]>({
    queryKey: ['price-list-items', priceListId],
    enabled: !!priceListId,
    queryFn: async () => {
      const res = await api.get(`/purchasing/price-lists/${priceListId}/items`);
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useAddPriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ priceListId, ...data }: { priceListId: string; productId: string; unitPrice: number; currency?: string; minQuantity?: number }) => {
      const res = await api.post(`/purchasing/price-lists/${priceListId}/items`, {
        ...data,
        currency: data.currency ?? 'VED',
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-list-items', variables.priceListId] });
    },
  });
}

export function useRemovePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ priceListId, itemId }: { priceListId: string; itemId: string }) => {
      await api.delete(`/purchasing/price-lists/${priceListId}/items/${itemId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-list-items', variables.priceListId] });
    },
  });
}
