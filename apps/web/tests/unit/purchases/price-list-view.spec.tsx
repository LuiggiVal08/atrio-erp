import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PriceListListView } from '@/modules/purchases/views/PriceListListView';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/modules/purchases/hooks/usePriceLists', () => ({
  usePriceLists: () => ({ data: [], isLoading: false, refetch: vi.fn(), isFetching: false }),
  useCreatePriceList: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: () => null }));

function renderView() {
  render(
    <MemoryRouter>
      <PriceListListView />
    </MemoryRouter>,
  );
}

function openForm() {
  fireEvent.click(screen.getByRole('button', { name: 'Nueva lista' }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PriceListListView form', () => {
  it('blocks submission with an empty name', async () => {
    renderView();
    openForm();

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('obligatorio'));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits trimmed values and closes the form', async () => {
    mutateAsync.mockResolvedValueOnce({ id: 'list-1' });
    renderView();
    openForm();

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: '  Compra anual  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Crear' })).toBeNull());
    expect(mutateAsync).toHaveBeenCalledWith({ name: 'Compra anual', type: 'purchase' });
  });

  it('maps a server field error and keeps the form open', async () => {
    const error = new AxiosError('Request failed with status code 400');
    (error as { response?: unknown }).response = {
      status: 400,
      data: { errors: [{ field: 'name', message: 'Ya existe una lista con ese nombre' }] },
    };
    mutateAsync.mockRejectedValueOnce(error);
    renderView();
    openForm();

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Compra anual' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Ya existe una lista con ese nombre',
      ),
    );
    expect(screen.getByLabelText(/Nombre/)).toBeTruthy();
  });
});
