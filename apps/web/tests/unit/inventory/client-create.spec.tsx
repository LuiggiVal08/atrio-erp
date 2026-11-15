import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientListView } from '@/modules/inventory/views/ClientListView';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/shared/hooks/useClients', () => ({
  useClients: () => ({ data: [], isLoading: false, refetch: vi.fn(), isFetching: false }),
  useClientsPage: () => ({ data: { data: [], total: 0, page: 1, pageSize: 25 }, isLoading: false, refetch: vi.fn(), isFetching: false }),
}));
vi.mock('@/modules/client-vendor/hooks/useCreateClient', () => ({
  useCreateClient: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: () => null }));

function renderView() {
  render(
    <MemoryRouter>
      <ClientListView />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: /crear/i }));
}

function fillDocument(value: string) {
  const input = screen.getByPlaceholderText('Número de documento');
  const select = input.parentElement?.querySelector('select');
  if (!select) throw new Error('document type select not found');
  fireEvent.change(select, { target: { value: 'CI' } });
  fireEvent.change(input, { target: { value } });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ClientListView form', () => {
  it('validates the email before calling the API', async () => {
    renderView();

    fireEvent.change(screen.getByLabelText(/Razón Social/), {
      target: { value: 'ACME' },
    });
    fillDocument('12345678');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'no-es-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('El correo no es válido'),
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits the identity and falls back to the document for the tax id', async () => {
    mutateAsync.mockResolvedValueOnce({ id: 'client-1' });
    renderView();

    fireEvent.change(screen.getByLabelText(/Razón Social/), {
      target: { value: 'ACME' },
    });
    fillDocument('12345678');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        legalName: 'ACME',
        documentId: '12345678',
        identificationType: 'CI_VE',
        taxId: '12345678',
      }),
    );
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  });
});
