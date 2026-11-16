import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReorderPointListView } from '@/modules/inventory/views/ReorderPointListView';

const refetchLowStock = vi.fn();

vi.mock('@/modules/inventory/hooks/useReorderPoints', () => ({
  useReorderPoints: () => ({ data: [], isLoading: false, isFetching: false, refetch: vi.fn() }),
  useLowStock: () => ({ data: undefined, isLoading: false, isError: true, refetch: refetchLowStock }),
  useSetReorderPoint: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteReorderPoint: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/modules/inventory/hooks/useInventoryList', () => ({ useInventoryProducts: () => ({ data: [] }) }));
vi.mock('@/modules/inventory/hooks/useWarehouses', () => ({ useWarehouses: () => ({ data: [] }) }));

afterEach(() => {
  cleanup();
  refetchLowStock.mockReset();
});

describe('reorder point low-stock state', () => {
  it('does not show a green empty state when the alert request fails and allows retrying', () => {
    render(<ReorderPointListView />);
    expect(screen.queryByText('Sin alertas de reposición')).toBeNull();
    expect(screen.getByText('No se pudieron cargar las alertas de reposición')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetchLowStock).toHaveBeenCalledTimes(1);
  });
});
