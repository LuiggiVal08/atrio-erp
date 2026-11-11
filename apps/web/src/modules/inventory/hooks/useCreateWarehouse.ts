import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code?: string; branchId?: string; aisle?: string; shelf?: string; level?: string; bin?: string }) => {
      const res = await api.post('/inventory/warehouses', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}
