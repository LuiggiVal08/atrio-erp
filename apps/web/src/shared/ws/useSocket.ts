import { useEffect } from 'react';
import { getSocket, connectSocket } from './socket';
import { useAuthStore } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const tenantId = useTenantStore((s) => s.activeTenantId);

  useEffect(() => {
    if (token && tenantId) {
      connectSocket(token, tenantId);
    }
  }, [token, tenantId]);

  return getSocket();
}
