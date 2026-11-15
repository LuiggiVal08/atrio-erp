import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { useClientsPage } from '@/shared/hooks/useClients';
import { useVendorsPage } from '@/shared/hooks/useVendors';

vi.mock('@/shared/lib/api/client', () => ({
  default: { get: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('third-party pagination hooks', () => {
  afterEach(() => vi.clearAllMocks());

  it('requests the selected client page and returns the real total', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ id: 'c101' }], total: 145, page: 5, pageSize: 25 } });
    const { result } = renderHook(() => useClientsPage('ana', 5, 25), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/client-vendor/clients?page=5&pageSize=25&search=ana');
    expect(result.current.data).toMatchObject({ total: 145, page: 5 });
  });

  it('requests the selected vendor page beyond the first hundred records', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ id: 'v121' }], total: 145, page: 5, pageSize: 25 } });
    const { result } = renderHook(() => useVendorsPage(undefined, 5, 25), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/client-vendor/vendors?page=5&pageSize=25');
    expect(result.current.data?.total).toBe(145);
  });
});
