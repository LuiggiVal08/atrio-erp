import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandListView } from '@/modules/inventory/views/BrandListView';
import { CategoryListView } from '@/modules/inventory/views/CategoryListView';

const spies = vi.hoisted(() => ({
  createBrand: vi.fn(),
  updateBrand: vi.fn(),
  updateCategory: vi.fn(),
}));

vi.mock('@/core/auth/usePermission', () => ({ usePermission: () => true }));
vi.mock('@/shared/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [{ id: 'cat-1', name: 'Herramientas', parentId: null }],
    isLoading: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));
vi.mock('@/modules/inventory/hooks/useCreateCategory', () => ({
  useCreateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/modules/inventory/hooks/useUpdateCategory', () => ({
  useUpdateCategory: () => ({ mutate: spies.updateCategory, isPending: false }),
}));
vi.mock('@/modules/inventory/hooks/useDeleteCategory', () => ({
  useDeleteCategory: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/modules/inventory/hooks/useBrands', () => ({
  useBrands: () => ({
    data: [{ id: 'brand-1', name: 'Bosch', logoUrl: null, logoFile: null, isActive: true }],
    isLoading: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useCreateBrand: () => ({ mutate: spies.createBrand, isPending: false }),
  useUpdateBrand: () => ({ mutate: spies.updateBrand, isPending: false }),
  useUploadBrandLogo: () => ({ mutate: vi.fn(), isPending: false }),
}));

beforeEach(() => {
  spies.createBrand.mockReset();
  spies.updateBrand.mockReset();
  spies.updateCategory.mockReset();
});
afterEach(cleanup);

describe('catalog form validation', () => {
  it('trims a brand before creating it', async () => {
    render(<BrandListView />);
    fireEvent.change(screen.getByLabelText('Nombre de la nueva marca'), {
      target: { value: '  Bosch  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() =>
      expect(spies.createBrand).toHaveBeenCalledWith(
        { name: 'Bosch' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('updates an inline brand name', async () => {
    render(<BrandListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = await screen.findByDisplayValue('Bosch');
    fireEvent.change(input, { target: { value: ' Makita ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(spies.updateBrand).toHaveBeenCalledWith(
        { id: 'brand-1', name: 'Makita' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('updates an inline category name and clears its parent', async () => {
    render(<CategoryListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = await screen.findByDisplayValue('Herramientas');
    fireEvent.change(input, { target: { value: ' Tornillería ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(spies.updateCategory).toHaveBeenCalledWith(
        { id: 'cat-1', name: 'Tornillería', parentId: null },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });
});
