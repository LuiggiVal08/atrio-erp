import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTenantStore } from '@/core/tenant/store';
import { useClients } from '@/shared/hooks/useClients';
import { useWarehouses } from '@/shared/hooks/useWarehouses';

vi.mock('@/shared/lib/api/client', () => ({
  default: { get: vi.fn(async () => ({ data: [] })) },
}));

afterEach(() => {
  cleanup();
  useTenantStore.setState({ activeTenantId: null });
});

function wrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('tenant-aware query keys', () => {
  it('segregates client caches when the active tenant changes', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useTenantStore.setState({ activeTenantId: 'tenant-a' });
    renderHook(() => useClients(), { wrapper: wrapper(client) });
    await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(1));

    act(() => useTenantStore.setState({ activeTenantId: 'tenant-b' }));
    await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(2));

    const keys = client.getQueryCache().getAll().map((query) => query.queryKey);
    expect(keys).toContainEqual(['clients', undefined, 'tenant-a']);
    expect(keys).toContainEqual(['clients', undefined, 'tenant-b']);
  });

  it('segregates shared warehouse reference caches by tenant', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useTenantStore.setState({ activeTenantId: 'tenant-a' });
    renderHook(() => useWarehouses(), { wrapper: wrapper(client) });
    await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(1));
    expect(client.getQueryCache().getAll()[0].queryKey).toEqual(['warehouses', 'tenant-a']);
  });
});
