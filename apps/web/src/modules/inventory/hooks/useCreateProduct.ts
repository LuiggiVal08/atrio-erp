import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ReturnType<typeof import('@/shared/validation/product').productPayload>) => {
      const res = await api.post('/inventory/products', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
