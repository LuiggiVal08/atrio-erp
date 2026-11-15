import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CurrencyRateListView } from '@/modules/inventory/views/CurrencyRateListView';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/modules/inventory/hooks/useCurrencyRates', () => ({
  useCurrencyRates: () => ({ data: [], isLoading: false, refetch: vi.fn(), isFetching: false }),
  useCreateCurrencyRate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSyncCurrencyRate: () => ({ mutate, isPending: false, isSuccess: false, isError: false, data: undefined }),
}));

vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: () => null }));

describe('CurrencyRateListView sync', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('requires explicit confirmation before replacing the rate and hides unsupported custom providers', () => {
    render(<CurrencyRateListView />);

    expect(screen.queryByText('Proveedores personalizados')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar automáticamente' }));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar actualización' }));
    expect(mutate).toHaveBeenCalledWith({ fromCurrency: 'USD', toCurrency: 'VES', providerIds: undefined });
  });
});
