import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api/client';
import { ProductDetailView } from '@/modules/inventory/views/ProductDetailView';

const stored = vi.hoisted(() => ({
  product: null as Record<string, unknown> | null,
}));

vi.mock('@/shared/lib/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/inventory/products/p-2') {
        return Promise.resolve({ data: stored.product });
      }
      if (url === '/inventory/products/p-1') {
        return Promise.resolve({
          data: {
            id: 'p-1',
            sku: 'SKU-001',
            name: 'Taladro percutor',
            description: 'Taladro de 1/2 pulgada',
            barcode: null,
            categoryId: 'cat-1',
            category: 'Herramientas',
            brandId: 'brand-1',
            brand: 'Truper',
            taxId: 'tax-1',
            taxName: 'IVA',
            unitPrice: 25,
            costPrice: 10,
            isService: false,
            isActive: true,
            baseUnit: 'unidad',
            purchaseUnit: 'caja',
            conversionFactor: 4,
            minStock: 2,
            maxStock: 50,
            reorderPoint: 5,
            supplierSku: 'TR-500',
          },
        });
      }
      if (url === '/inventory/categories') {
        return Promise.resolve({ data: [{ id: 'cat-1', name: 'Herramientas' }, { id: 'cat-2', name: 'Electricidad' }] });
      }
      if (url === '/inventory/brands') {
        return Promise.resolve({ data: [{ id: 'brand-1', name: 'Truper', isActive: true, logoUrl: 'https://cdn.test/truper.png' }, { id: 'brand-2', name: 'Bosch', isActive: true, logoUrl: null }] });
      }
      if (url === '/localization/taxes') {
        return Promise.resolve({ data: [{ id: 'tax-1', name: 'IVA', rate: 0.16 }] });
      }
      return Promise.resolve({ data: [] });
    }),
    patch: vi.fn().mockImplementation((_url: string, data: Record<string, unknown>) => {
      if (stored.product) Object.assign(stored.product, data);
      return Promise.resolve({ data: stored.product ?? {} });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));
vi.mock('@/core/services/toast-service', () => ({
  toastService: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/modules/inventory/components/ProductImageGallery', () => ({
  ProductImageGallery: () => null,
}));
vi.mock('@/modules/inventory/components/ProductBarcodeLabel', () => ({
  ProductBarcodeLabel: () => null,
}));

function renderDetail(id = 'p-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[`/inventory/${id}`]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/inventory/:id" element={<ProductDetailView />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('product detail and edit', () => {
  it('shows brand, category and unit fields in read mode', async () => {
    renderDetail();
    expect(await screen.findByRole('heading', { name: 'Taladro percutor' })).toBeDefined();
    expect(screen.getAllByText('Truper').length).toBeGreaterThan(0);
    expect(screen.getByText('Herramientas')).toBeDefined();
    expect(screen.getByText('TR-500')).toBeDefined();
    expect(screen.getByText('caja')).toBeDefined();
  });

  it('shows the brand logo beside the description in read mode', async () => {
    const { container } = renderDetail();
    await screen.findByRole('heading', { name: 'Taladro percutor' });
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/truper.png');
  });

  it('swaps the description logo chip live while editing', async () => {
    const { container } = renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/truper.png');

    const brand = screen.getByRole('combobox', { name: 'Marca' });
    fireEvent.focus(brand);
    fireEvent.change(brand, { target: { value: 'bos' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Bosch' }));

    expect(await screen.findByText('B')).toBeDefined();
    expect(container.querySelector('img')).toBeNull();
  });

  it('edits brand through the combobox and saves all fields', async () => {
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    const brand = screen.getByRole('combobox', { name: 'Marca' });
    fireEvent.focus(brand);
    fireEvent.change(brand, { target: { value: 'bos' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Bosch' }));

    fireEvent.change(screen.getByLabelText('Stock mínimo'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '30' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/inventory/products/p-1', expect.objectContaining({
      sku: 'SKU-001',
      name: 'Taladro percutor',
      brandId: 'brand-2',
      categoryId: 'cat-1',
      taxId: 'tax-1',
      minStock: 5,
      unitPrice: 30,
      conversionFactor: 4,
      reorderPoint: 5,
      supplierSku: 'TR-500',
    })));
  });

  it('sends null to clear the brand selection', async () => {
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    const brand = screen.getByRole('combobox', { name: 'Marca' });
    fireEvent.focus(brand);
    fireEvent.click(within(brand.closest('div')!).getByRole('button', { name: 'Limpiar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/inventory/products/p-1', expect.objectContaining({
      brandId: null,
    })));
  });
});

describe('product with empty optional fields', () => {
  beforeEach(() => {
    stored.product = {
      id: 'p-2',
      sku: 'STA-DEST-6P',
      name: 'Juego de Destornilladores Stanley Pro 6 Piezas',
      description: null,
      barcode: '7477526004567',
      categoryId: 'cat-1',
      category: 'Herramientas',
      brandId: null,
      brand: '',
      taxId: 'tax-1',
      taxName: 'IVA',
      unitPrice: 18,
      costPrice: 11,
      isService: false,
      isActive: true,
      baseUnit: null,
      purchaseUnit: null,
      conversionFactor: null,
      minStock: null,
      maxStock: null,
      reorderPoint: null,
      supplierSku: null,
    };
  });

  it('renders no brand chip when the product has no brand', async () => {
    const { container } = renderDetail('p-2');
    await screen.findByRole('heading', { name: 'Juego de Destornilladores Stanley Pro 6 Piezas' });
    expect(container.querySelector('img')).toBeNull();
  });

  it('lets every empty field be filled and saves the values', async () => {
    renderDetail('p-2');
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    const supplier = screen.getByLabelText('Referencia del proveedor') as HTMLInputElement;
    expect(supplier.value).toBe('');
    fireEvent.change(supplier, { target: { value: 'STA-PRO-6P' } });
    fireEvent.change(screen.getByLabelText('Unidad de compra'), { target: { value: 'Caja x6' } });
    fireEvent.change(screen.getByLabelText('Stock mínimo'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Stock máximo'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Punto de reorden'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Conversión a unidad base'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Unidad base'), { target: { value: 'unidad' } });

    const brand = screen.getByRole('combobox', { name: 'Marca' });
    fireEvent.focus(brand);
    fireEvent.change(brand, { target: { value: 'tru' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Truper' }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/inventory/products/p-2', expect.objectContaining({
      supplierSku: 'STA-PRO-6P',
      purchaseUnit: 'Caja x6',
      minStock: 5,
      maxStock: 50,
      reorderPoint: 8,
      conversionFactor: 1,
      baseUnit: 'unidad',
      brandId: 'brand-1',
    })));
  });

  it('shows the saved values in read mode without reloading', async () => {
    renderDetail('p-2');
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Referencia del proveedor'), { target: { value: 'STA-PRO-6P' } });
    fireEvent.change(screen.getByLabelText('Stock máximo'), { target: { value: '50' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('STA-PRO-6P')).toBeDefined();
    expect(await screen.findByText('50')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  });
});
