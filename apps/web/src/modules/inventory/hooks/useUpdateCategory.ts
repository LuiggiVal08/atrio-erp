import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; parentId?: string | null }) => {
      const res = await api.patch('/inventory/categories/' + id, data);
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
