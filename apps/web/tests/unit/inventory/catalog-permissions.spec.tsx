import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryListView } from '@/modules/inventory/views/CategoryListView';
import { BrandListView } from '@/modules/inventory/views/BrandListView';

const auth = vi.hoisted(() => ({ enabled: false }));
const uploadLogo = vi.hoisted(() => vi.fn());

vi.mock('@/core/auth/usePermission', () => ({ usePermission: () => auth.enabled }));
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
  useUpdateCategory: () => ({ mutate: vi.fn(), isPending: false }),
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
  useCreateBrand: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateBrand: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadBrandLogo: () => ({ mutate: uploadLogo, isPending: false }),
}));

beforeEach(() => {
  auth.enabled = false;
  uploadLogo.mockReset();
});
afterEach(cleanup);

describe('catalog permission controls', () => {
  it('hides category create, edit and delete controls from readers', () => {
    render(<CategoryListView />);
    expect(screen.queryByRole('button', { name: 'Nueva categoría' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull();
  });

  it('hides brand create, edit and logo controls from readers', () => {
    render(<BrandListView />);
    expect(screen.queryByLabelText('Nombre de la nueva marca')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByText('Agregar logo')).toBeNull();
    expect(screen.queryByText('Desactivar')).toBeNull();
  });

  it('uploads a selected brand logo only once', () => {
    auth.enabled = true;
    const { container } = render(<BrandListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar logo' }));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['logo'], 'logo.png', { type: 'image/png' })] } });
    expect(uploadLogo).toHaveBeenCalledTimes(1);
  });
});
