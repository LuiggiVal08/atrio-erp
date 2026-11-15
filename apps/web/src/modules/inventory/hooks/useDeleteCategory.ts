import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete('/inventory/categories/' + id);
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
