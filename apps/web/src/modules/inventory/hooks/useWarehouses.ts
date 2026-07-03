import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface Warehouse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/inventory/warehouses');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/inventory/warehouses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); },
  });
}
