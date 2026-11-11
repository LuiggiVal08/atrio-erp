import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: { permission: { id: string; code: string; name: string; module: string; action: string } }[];
}

function useTenantId() {
  return useTenantStore.getState().activeTenantId;
}

export function useRoles() {
  const tenantId = useTenantId();
  return useQuery<Role[]>({
    queryKey: ['roles', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/rbac/roles`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; permissionIds: string[] }) => {
      const res = await api.post(`/tenants/${tenantId}/rbac/roles`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description?: string; permissionIds: string[] }) => {
      const res = await api.patch(`/tenants/${tenantId}/rbac/roles/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tenants/${tenantId}/rbac/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAssignRoles() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
      await api.post(`/tenants/${tenantId}/rbac/users/${userId}/roles`, { roleIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
