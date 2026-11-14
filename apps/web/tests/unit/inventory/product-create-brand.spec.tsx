import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { InventoryListView } from '@/modules/inventory/views/InventoryListView';

vi.mock('@/shared/lib/api/client', () => {
  const brands = [
    { id: 'brand-1', name: 'Truper', isActive: true },
    { id: 'brand-2', name: 'Bosch', isActive: true },
  ];
  return {
    default: {
      get: vi.fn().mockImplementation((url: string) => {
        if (url === '/inventory/categories') {
          return Promise.resolve({ data: [{ id: 'cat-1', name: 'Herramientas' }, { id: 'cat-2', name: 'Electricidad' }] });
        }
        if (url === '/inventory/brands') {
          return Promise.resolve({ data: [...brands] });
        }
        if (url === '/inventory/products/summary') {
          return Promise.resolve({
            data: {
              totalProducts: 0,
              stockHealth: { healthy: 0, low: 0, out: 0, overstock: 0 },
              valuation: { currency: 'VED', totalValue: 0, categories: [] },
              coverage: { periodDays: 30, medianDays: null, under7: 0, from7to30: 0, over30: 0, noSales: 0 },
            },
          });
        }
        return Promise.resolve({ data: [] });
      }),
      post: vi.fn().mockImplementation((url: string, data: { name?: string }) => {
        if (url === '/inventory/brands') {
          const created = { id: 'brand-new', name: data.name ?? '', isActive: true };
          brands.push(created);
          return Promise.resolve({ data: created });
        }
        return Promise.resolve({ data: { id: 'created' } });
      }),
    },
  };
});
vi.mock('@/core/components/VirtualGrid', () => ({ VirtualGrid: () => null }));
vi.mock('@/modules/inventory/hooks/useInventoryList', () => ({
  useInventoryList: () => ({ refetch: vi.fn(), isFetching: false, isLoading: false, items: [], total: 0 }),
  useInventoryProducts: () => ({ data: [] }),
}));
vi.mock('@/modules/inventory/store/inventory-store', () => ({
  useInventoryStore: () => ({ filter: '', setFilter: vi.fn(), setSort: vi.fn(), sortColumn: null, sortDirection: 'asc', page: 1, pageSize: 25, setPage: vi.fn(), setPageSize: vi.fn() }),
}));

function openProductForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}><InventoryListView /></QueryClientProvider>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: '+ Crear producto' }));
  fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'TEST-SKU' } });
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Producto de prueba' } });
  fireEvent.change(screen.getByLabelText('Costo de compra'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Precio de venta'), { target: { value: '25' } });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('product creation with searchable category and brand', () => {
  it('sends the selected categoryId and brandId', async () => {
    openProductForm();

    const category = await screen.findByLabelText('Categorías');
    fireEvent.focus(category);
    fireEvent.change(category, { target: { value: 'electri' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Electricidad' }));

    const brand = screen.getByLabelText('Marca');
    fireEvent.focus(brand);
    fireEvent.change(brand, { target: { value: 'tru' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Truper' }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/inventory/products', expect.objectContaining({
      sku: 'TEST-SKU',
      categoryId: 'cat-2',
      brandId: 'brand-1',
    })));
  });

  it('quick-creates a brand and selects it automatically', async () => {
    openProductForm();

    fireEvent.click(screen.getByRole('button', { name: 'Nueva marca' }));
    const brandInput = screen.getByPlaceholderText('Nueva marca');
    fireEvent.change(brandInput, { target: { value: 'Nueva Marca' } });
    const quickCreate = within(brandInput.closest('div')!.parentElement!).getByRole('button', { name: 'Guardar' });
    fireEvent.click(quickCreate);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/inventory/brands', { name: 'Nueva Marca' }));
    await waitFor(() => expect((screen.getByLabelText('Marca') as HTMLInputElement).value).toBe('Nueva Marca'));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/inventory/products', expect.objectContaining({
      brandId: 'brand-new',
    })));
  });
});
