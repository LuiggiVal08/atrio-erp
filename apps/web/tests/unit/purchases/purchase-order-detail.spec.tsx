import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseOrderDetailView } from '@/modules/purchases/views/PurchaseOrderDetailView';

const { updateMutateAsync, order } = vi.hoisted(() => ({
  updateMutateAsync: vi.fn(),
  order: {
    id: 'po-1',
    documentId: 'PO-0001',
    vendorId: 'v1',
    subtotal: 100,
    taxAmount: 0,
    total: 100,
    currency: 'VED',
    status: 'pending',
    expectedDate: '2030-01-15T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
}));

vi.mock('@/modules/purchases/hooks/usePurchaseOrders', () => ({
  usePurchaseOrder: () => ({ data: order, isLoading: false }),
  useApprovePurchaseOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useReceivePurchaseOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useCompleteReceivePurchaseOrder: () => ({ mutate: vi.fn(), isPending: false }),
  useDeletePurchaseOrder: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useUpdatePurchaseOrder: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock('@/core/components/DocumentStateBadge', () => ({ DocumentStateBadge: () => null }));
vi.mock('@/core/components/DocumentTimeline', () => ({ DocumentTimeline: () => null }));

function renderDetail() {
  render(
    <MemoryRouter initialEntries={['/purchasing/po-1']}>
      <Routes>
        <Route path="/purchasing/:id" element={<PurchaseOrderDetailView />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  updateMutateAsync.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PurchaseOrderDetailView expected date editing', () => {
  it('edits and saves the expected date', async () => {
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.value).toBe('2030-01-15');

    fireEvent.change(input, { target: { value: '2030-02-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({ id: 'po-1', expectedDate: '2030-02-01' }),
    );
  });

  it('cancels without saving', () => {
    renderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2030-02-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(updateMutateAsync).not.toHaveBeenCalled();
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });
});
