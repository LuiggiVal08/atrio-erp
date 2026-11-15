import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; parentId?: string }) => {
      const res = await api.post('/inventory/categories', data);
      return res.data;
    },
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['product'] }),
      ]);
    },
  });
}
