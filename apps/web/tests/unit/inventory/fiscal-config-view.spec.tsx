import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FiscalConfigView } from '@/modules/inventory/views/FiscalConfigView';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/modules/inventory/hooks/useTaxes', () => ({
  useTaxes: () => ({ data: [], isLoading: false }),
  useCreateTax: () => ({ mutate: vi.fn(), mutateAsync, isPending: false }),
}));

vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: () => null }));

describe('FiscalConfigView', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps a fixed amount intact instead of dividing it by 100', async () => {
    mutateAsync.mockResolvedValueOnce({ id: 'tax-1' });
    render(<FiscalConfigView />);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Tasa municipal' } });
    fireEvent.change(screen.getByLabelText('Tasa %'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'fixed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Tasa municipal',
      rate: 50,
      type: 'fixed',
    }));
  });

  it('stores percentages as a fraction', async () => {
    mutateAsync.mockResolvedValueOnce({ id: 'tax-2' });
    render(<FiscalConfigView />);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'IVA' } });
    fireEvent.change(screen.getByLabelText('Tasa %'), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({
      name: 'IVA',
      rate: 0.16,
      type: 'percentage',
    }));
  });

  it('retains the entered values and shows the error when saving fails', async () => {
    mutateAsync.mockRejectedValueOnce({ response: { data: { message: 'No se pudo guardar' } } });
    render(<FiscalConfigView />);

    const name = screen.getByLabelText('Nombre') as HTMLInputElement;
    const rate = screen.getByLabelText('Tasa %') as HTMLInputElement;
    fireEvent.change(name, { target: { value: 'IVA' } });
    fireEvent.change(rate, { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No se pudo guardar'));
    expect(name.value).toBe('IVA');
    expect(rate.value).toBe('16');
  });
});
