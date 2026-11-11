import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  locale: string;
  status: string;
  imageUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  roles: { role: { id: string; name: string } }[];
}

function useTenantId() {
  return useTenantStore.getState().activeTenantId;
}

export function useUsers() {
  const tenantId = useTenantId();
  return useQuery<User[]>({
    queryKey: ['users', tenantId],
    queryFn: async () => {
      const res = await api.get(`/tenants/${tenantId}/users`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; phone?: string }) => {
      const res = await api.post(`/tenants/${tenantId}/users`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tenants/${tenantId}/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
