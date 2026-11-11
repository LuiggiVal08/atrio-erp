import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/shared/lib/api/client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  locale: string;
  phone?: string | null;
  imageUrl?: string | null;
  enabledModules: string[];
  permissions?: string[];
  tenantId: string;
  sessionTimeoutMinutes?: number;
};

export type TenantInfo = {
  id: string;
  slug: string;
  legalName: string;
  isHome?: boolean;
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  tenants: TenantInfo[];
  setAuth: (token: string, user: AuthUser) => void;
  setToken: (token: string) => void;
  setUser: (user: Partial<AuthUser>) => void;
  setTenants: (tenants: TenantInfo[]) => void;
  switchTenant: (tenantId: string) => Promise<void>;
  fetchTenants: () => Promise<void>;
  logout: (revokeSession?: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenants: [],

      setAuth: (token, user) => {
        localStorage.setItem('x-tenant-id', user.tenantId);
        set({ token, user });
      },

      setToken: (token) => set({ token }),

      setUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),

      setTenants: (tenants) => set({ tenants }),

      switchTenant: async (tenantId: string) => {
        const { tenants } = get();
        const res = await api.post('/auth/switch-tenant', { tenantId });
        const data = res.data;
        localStorage.setItem('x-tenant-id', tenantId);
        set({
          token: data.accessToken,
          user: data.user,
          tenants: tenants.map((t) => ({ ...t, isHome: t.id === tenantId })),
        });
      },

      fetchTenants: async () => {
        if (!get().token) return;
        try {
          const res = await api.get('/auth/tenants');
          set({ tenants: Array.isArray(res.data) ? res.data : (res.data?.tenants ?? []) });
        } catch {
          // The API interceptor already clears the session when refresh fails with 401.
        }
      },

      logout: (revokeSession = true) => {
        const token = get().token;
        if (revokeSession && token) {
          void api.post('/auth/logout', null, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch((error: unknown) => {
            console.error('[Auth] Server logout failed', error);
          });
        }
        localStorage.removeItem('x-tenant-id');
        set({ token: null, user: null, tenants: [] });
      },
    }),
    { name: 'atrio-auth', partialize: (state) => ({ token: state.token, user: state.user }) },
  ),
);
