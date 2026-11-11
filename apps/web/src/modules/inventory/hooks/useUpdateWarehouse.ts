import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface WarehouseUpdate {
  name?: string;
  code?: string | null;
  branchId?: string | null;
  isActive?: boolean;
  aisle?: string | null;
  shelf?: string | null;
  level?: string | null;
  bin?: string | null;
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WarehouseUpdate }) =>
      (await api.patch(`/inventory/warehouses/${id}`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); },
  });
}
