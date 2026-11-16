import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/shared/lib/api/client';
import { useTenantStore } from '@/core/tenant/store';
import { useAdjustStock, useAllStockMovements, useStockBalances } from '@/modules/inventory/hooks/useStockMovements';
import { useCancelTransfer, useDispatchTransfer, useReceiveTransfer } from '@/modules/inventory/hooks/useTransfers';

vi.mock('@/shared/lib/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

beforeEach(() => {
  vi.resetAllMocks();
  useTenantStore.getState().setActiveTenant('tenant-1');
});

describe('inventory transactional hooks', () => {
  it('segregates balances by reactive tenant identity', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useStockBalances(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(['stock-balances', 'tenant-1'])).toEqual([]);
    act(() => useTenantStore.getState().setActiveTenant('tenant-2'));
    await waitFor(() => expect(client.getQueryData(['stock-balances', 'tenant-2'])).toEqual([]));
  });

  it('sends server movement filters and keeps the server total', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [{ id: 'movement-1' }], total: 650, page: 3, pageSize: 25 } });
    const { wrapper } = setup();
    const { result } = renderHook(() => useAllStockMovements({ page: 3, pageSize: 25, search: 'pipe', warehouseId: 'warehouse-1' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(650);
    expect(api.get).toHaveBeenCalledWith('/inventory/stock/movements', expect.objectContaining({ params: expect.objectContaining({ page: 3, pageSize: 25, search: 'pipe', warehouseId: 'warehouse-1' }) }));
  });

  it('preserves retry identity and optimistic count baseline in adjustment requests', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { quantity: 2.5 } });
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useAdjustStock(), { wrapper });
    await act(() => result.current.mutateAsync({ productId: 'p', warehouseId: 'w', type: 'out', quantity: 0.5, reason: 'Count', operationId: 'operation-1', expectedQuantity: 3 }));
    expect(api.post).toHaveBeenCalledWith('/inventory/stock/p/w/adjust', expect.objectContaining({ operationId: 'operation-1', expectedQuantity: 3, quantity: 0.5 }));
    for (const key of ['stock-balances', 'stock-movements-all', 'inventory', 'reorder-points', 'warehouses']) {
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: [key] }));
    }
  });

  it('dispatches a transfer and refreshes stock, history, product and alerts', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useDispatchTransfer(), { wrapper });
    await act(() => result.current.mutateAsync('transfer-1'));
    expect(api.patch).toHaveBeenCalledWith('/inventory/transfers/transfer-1/dispatch');
    for (const key of ['stock-transfers', 'stock-balances', 'stock-movements-all', 'inventory', 'reorder-points', 'warehouses']) {
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: [key] }));
    }
  });

  it('receives a partial transfer quantity and refreshes stock', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useReceiveTransfer(), { wrapper });
    await act(() => result.current.mutateAsync({ id: 'transfer-1', quantity: 2, closeShortage: true }));
    expect(api.patch).toHaveBeenCalledWith('/inventory/transfers/transfer-1/receive', { quantity: 2, closeShortage: true });
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['stock-balances'] }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['stock-movements-all'] }));
  });

  it('cancels a pending transfer and refreshes the released commitment', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: {} });
    const { client, wrapper } = setup();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCancelTransfer(), { wrapper });
    await act(() => result.current.mutateAsync('transfer-1'));
    expect(api.patch).toHaveBeenCalledWith('/inventory/transfers/transfer-1/cancel');
    for (const key of ['stock-transfers', 'stock-balances', 'inventory', 'reorder-points']) {
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: [key] }));
    }
  });
});
