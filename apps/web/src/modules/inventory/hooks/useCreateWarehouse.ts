import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  return useMutation({
    mutationFn: async (data: { name: string; code?: string; branchId?: string }) => {
      const res = await api.post('/inventory/warehouses', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
    },
  });
}
