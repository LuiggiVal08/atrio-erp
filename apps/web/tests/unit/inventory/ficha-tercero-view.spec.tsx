import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FichaTerceroView } from '@/modules/inventory/views/FichaTerceroView';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/modules/inventory/hooks/useFichaTercero', () => ({
  useFichaTercero: () => ({
    isLoading: false,
    isError: false,
    data: {
      id: 'v1',
      kind: 'vendor',
      legalName: 'Suministros Ana',
      documentId: 'J123',
      taxId: 'J123',
      email: 'ana@example.com',
      phone: '123',
      isActive: true,
      address: { id: 'a1', line1: 'Av. Principal', line2: 'Torre 2', city: 'Caracas', state: 'Miranda', country: 'VE', isPrimary: true },
      contacts: [{
        id: 'c1', fullName: 'Ana', position: 'Dueño', email: 'ana@example.com', phone: '123',
        mobile: '456', identificationNumber: 'V123', isPrimary: true,
      }],
    },
  }),
}));

vi.mock('@/modules/client-vendor/hooks/useUpdateVendor', () => ({
  useUpdateVendor: () => ({ mutateAsync, isPending: false }),
}));

vi.mock('@/shared/hooks/useCategories', () => ({ useCategories: () => ({ data: [] }) }));
vi.mock('@/shared/ui/MultiSelect', () => ({ MultiSelect: () => null }));
vi.mock('@/core/services/toast-service', () => ({
  toastService: { success: vi.fn(), error: vi.fn() },
}));

describe('FichaTerceroView', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('displays the stored address and sends address, general and contact fields on save', async () => {
    mutateAsync.mockResolvedValueOnce({});
    render(<MemoryRouter><FichaTerceroView id="v1" kind="vendor" /></MemoryRouter>);

    expect(screen.getByText('Av. Principal')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('Móvil'), { target: { value: '999' } });
    const email = screen.getAllByDisplayValue('ana@example.com')[0] as HTMLInputElement;
    fireEvent.change(email, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      id: 'v1',
      email: null,
      address: {
        country: 'VE', state: 'Miranda', city: 'Caracas', addressLine: 'Av. Principal', reference: 'Torre 2',
      },
      contacts: [expect.objectContaining({
        id: 'c1', fullName: 'Ana', email: 'ana@example.com', mobile: '999', identificationNumber: 'V123',
      })],
    }));
  });
});
