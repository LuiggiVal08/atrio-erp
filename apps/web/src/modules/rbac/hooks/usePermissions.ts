import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export function usePermissions() {
  const tenantId = useTenantStore.getState().activeTenantId;
  return useQuery<Permission[]>({
    queryKey: ['permissions', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/rbac/permissions`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}
