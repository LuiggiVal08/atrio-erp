import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore, type AuthUser } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';
import { queryClient } from '@/core/lib/query-client';
import api from '@/shared/lib/api/client';

vi.mock('@/shared/lib/api/client', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const user: AuthUser = {
  id: 'user-1', email: 'user@example.test', name: 'User', locale: 'es',
  tenantId: 'tenant-1', enabledModules: [], permissions: [],
};

describe('authentication tenant context', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    useAuthStore.setState({ token: null, user: null, tenants: [] });
    useTenantStore.getState().clearTenant();
    localStorage.removeItem('x-tenant-id');
  });

  it('sets the same tenant for authentication and requests and drops previous identity data', () => {
    useTenantStore.getState().setActiveTenant('previous-tenant');
    queryClient.setQueryData(['stock-balances', 'previous-tenant'], ['private']);
    useAuthStore.getState().setAuth('token-1', user);
    expect(useTenantStore.getState().activeTenantId).toBe(user.tenantId);
    expect(localStorage.getItem('x-tenant-id')).toBe(user.tenantId);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('switches tenant only after the API confirms and removes cached previous tenant data', async () => {
    useAuthStore.getState().setAuth('token-1', user);
    queryClient.setQueryData(['inventory', 'tenant-1'], ['private']);
    vi.mocked(api.post).mockResolvedValue({ data: { accessToken: 'token-2', user: { ...user, tenantId: 'tenant-2' } } });
    await useAuthStore.getState().switchTenant('tenant-2');
    expect(useAuthStore.getState().token).toBe('token-2');
    expect(useTenantStore.getState().activeTenantId).toBe('tenant-2');
    expect(localStorage.getItem('x-tenant-id')).toBe('tenant-2');
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('keeps the current context and cache on a rejected tenant switch', async () => {
    useAuthStore.getState().setAuth('token-1', user);
    queryClient.setQueryData(['inventory', 'tenant-1'], ['private']);
    vi.mocked(api.post).mockRejectedValue(new Error('Forbidden'));
    await expect(useAuthStore.getState().switchTenant('tenant-2')).rejects.toThrow('Forbidden');
    expect(useTenantStore.getState().activeTenantId).toBe('tenant-1');
    expect(useAuthStore.getState().token).toBe('token-1');
    expect(queryClient.getQueryData(['inventory', 'tenant-1'])).toEqual(['private']);
  });

  it('clears tenant and cached data on logout', () => {
    useAuthStore.getState().setAuth('token-1', user);
    queryClient.setQueryData(['employees'], ['private']);
    useAuthStore.getState().logout(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useTenantStore.getState().activeTenantId).toBeNull();
    expect(localStorage.getItem('x-tenant-id')).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('does not restore a session when an old switch response arrives after logout', async () => {
    useAuthStore.getState().setAuth('token-1', user);
    let resolve!: (value: { data: { accessToken: string; user: AuthUser } }) => void;
    vi.mocked(api.post).mockReturnValue(new Promise((done) => { resolve = done; }));
    const switching = useAuthStore.getState().switchTenant('tenant-2');
    useAuthStore.getState().logout(false);
    resolve({ data: { accessToken: 'token-2', user: { ...user, tenantId: 'tenant-2' } } });
    await switching;
    expect(useAuthStore.getState().token).toBeNull();
    expect(useTenantStore.getState().activeTenantId).toBeNull();
  });
});
