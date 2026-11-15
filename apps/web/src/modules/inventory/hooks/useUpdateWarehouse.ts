import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

export interface WarehouseUpdate {
  name?: string;
  code?: string | null;
  branchId?: string | null;
  isActive?: boolean;
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WarehouseUpdate }) =>
      (await api.patch(`/inventory/warehouses/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
      // Balances embed warehouse names and branchId; reassignment must refresh them.
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] });
    },
  });
}
