import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TransferListView } from '@/modules/inventory/views/TransferListView';

afterEach(cleanup);

vi.mock('@/shared/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'es' }),
}));
vi.mock('@/core/components/VirtualGrid', () => ({
  VirtualGrid: ({ data, emptyMessage }: { data: unknown[]; emptyMessage: string }) => (
    <div>{data.length ? 'rows' : emptyMessage}</div>
  ),
}));
vi.mock('@/modules/inventory/hooks/useTransfers', () => ({
  useTransfers: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    error: { isAxiosError: true, response: { status: 403 } },
    refetch: vi.fn(),
    isFetching: false,
  }),
  useCreateTransfer: () => ({}),
  useDispatchTransfer: () => ({}),
  useReceiveTransfer: () => ({}),
  useCancelTransfer: () => ({}),
}));
vi.mock('@/modules/inventory/hooks/useWarehouses', () => ({ useWarehouses: () => ({ data: [] }) }));
vi.mock('@/modules/inventory/hooks/useInventoryList', () => ({
  useInventoryList: () => ({}),
  useInventoryProducts: () => ({ data: [] }),
}));

describe('TransferListView read state', () => {
  it('shows the permission failure instead of a false empty list', () => {
    render(<TransferListView />);
    expect(screen.getByRole('alert').textContent).toContain('common.readError.forbidden');
    expect(screen.queryByText('inventory.transfer.empty')).toBeNull();
  });
});
