import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sileo';
import { useThemeStore } from '@/core/store/theme-store';
import { useAuthStore } from '@/core/auth/store';
import api, { refreshAccessToken } from '@/shared/lib/api/client';
import axios from 'axios';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        return failureCount < 1 && (status === undefined || status >= 500);
      },
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const { current } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', current);
  }, [current]);

  useEffect(() => {
    let lastActivitySentAt = 0;
    const recordActivity = () => {
      const { token, user } = useAuthStore.getState();
      if (!token) return;

      const timeoutMs = (user?.sessionTimeoutMinutes ?? 60) * 60_000;
      const throttleMs = Math.min(60_000, Math.max(10_000, timeoutMs / 2));
      const now = Date.now();
      if (now - lastActivitySentAt < throttleMs) return;
      lastActivitySentAt = now;
      // Best-effort heartbeat: expected to fail while the API restarts or the session expires.
      void api.post('/auth/activity', null, { timeout: 4000 }).catch(() => {});
    };

    window.addEventListener('pointerdown', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('wheel', recordActivity, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('wheel', recordActivity);
    };
  }, []);

  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    if (!token) return;

    let expiresAt: number | undefined;
    try {
      const encodedPayload = token.split('.')[1];
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      expiresAt = JSON.parse(window.atob(paddedBase64)).exp * 1000;
    } catch {
      return;
    }
    if (!Number.isFinite(expiresAt)) return;

    const timer = window.setTimeout(() => {
      void refreshAccessToken().catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          useAuthStore.getState().logout(false);
          return;
        }
        console.error('[Auth] Scheduled token refresh failed', error);
      });
    }, Math.max(0, expiresAt - Date.now() - 60_000));

    return () => window.clearTimeout(timer);
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" options={{ autopilot: true }} />
      {children}
    </QueryClientProvider>
  );
}
