import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReorderPointListView } from '@/modules/inventory/views/ReorderPointListView';

vi.mock('@/modules/inventory/hooks/useReorderPoints', () => ({
  useReorderPoints: () => ({ data: [], isLoading: false, isFetching: false, refetch: vi.fn() }),
  useLowStock: () => ({
    data: [{
      productId: 'prod-1',
      warehouseId: 'wh-1',
      currentQuantity: 2,
      minQuantity: 5,
      maxQuantity: 12,
      suggestedQuantity: 10,
      productName: 'Tubo PVC',
      productSku: 'PVC-001',
      warehouseName: 'Almacén Central',
    }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSetReorderPoint: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteReorderPoint: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/modules/inventory/hooks/useInventoryList', () => ({ useInventoryProducts: () => ({ data: [] }) }));
vi.mock('@/modules/inventory/hooks/useWarehouses', () => ({ useWarehouses: () => ({ data: [] }) }));

afterEach(cleanup);

describe('reorder point low-stock list', () => {
  it('identifies the shortage and shows the suggested replenishment quantity', () => {
    render(<ReorderPointListView />);
    expect(screen.getByText('Tubo PVC')).toBeTruthy();
    expect(screen.getByText('PVC-001')).toBeTruthy();
    expect(screen.getByText('Almacén Central')).toBeTruthy();
    expect(screen.getByText('Sugerido: 10')).toBeTruthy();
  });
});
