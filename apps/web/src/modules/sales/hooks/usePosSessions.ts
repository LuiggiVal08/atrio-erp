import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';

export interface PosSession {
  id: string;
  cashRegisterId: string;
  userId: string;
  openingBalance: number;
  closingBalance: number | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
}

export function usePosSessions() {
  return useQuery<PosSession[]>({
    queryKey: ['pos-sessions'],
    queryFn: async () => {
      const res = await api.get('/pos/sessions');
      return res.data?.data || res.data?.items || res.data || [];
    },
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cashRegisterId: string; openingBalance: number }) => {
      const res = await api.post('/pos/sessions', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sessions'] });
    },
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, closingBalance }: { id: string; closingBalance: number }) => {
      const res = await api.patch(`/pos/sessions/${id}/close`, { closingBalance });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sessions'] });
    },
  });
}

export function useCurrentSession(cashRegisterId: string | null) {
  return useQuery<PosSession | null>({
    queryKey: ['pos-sessions', 'current', cashRegisterId],
    queryFn: async () => {
      if (!cashRegisterId) return null;
      const res = await api.get(`/pos/sessions/current`, { params: { cashRegisterId } });
      return res.data?.data || res.data || null;
    },
    enabled: !!cashRegisterId,
  });
}
