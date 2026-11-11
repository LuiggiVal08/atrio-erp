import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface Branch {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useBranches() {
  return useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/inventory/branches');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code?: string; address?: string; phone?: string }) =>
      (await api.post('/inventory/branches', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Branch> }) =>
      (await api.patch(`/inventory/branches/${id}`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/inventory/branches/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); },
  });
}
