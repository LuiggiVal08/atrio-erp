import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductDetailView } from '@/modules/inventory/views/ProductDetailView';

vi.mock('@/shared/lib/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/inventory/products/p-1') {
        return Promise.resolve({
          data: {
            id: 'p-1',
            sku: 'SKU-001',
            name: 'Taladro percutor',
            description: null,
            barcode: '7477526004567',
            categoryId: 'cat-1',
            category: 'Herramientas',
            brandId: null,
            brand: '',
            taxId: 'tax-1',
            taxName: 'IVA',
            unitPrice: 25,
            costPrice: 10,
            isService: false,
            isActive: true,
          },
        });
      }
      if (url === '/inventory/products/p-3') {
        return Promise.resolve({
          data: {
            id: 'p-3',
            sku: 'CAB-UTP6',
            name: 'Cable UTP cat6',
            description: null,
            barcode: null,
            categoryId: null,
            category: '',
            brandId: null,
            brand: '',
            taxId: null,
            taxName: '',
            unitPrice: 1.5,
            costPrice: 0.8,
            isService: false,
            isActive: true,
          },
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));
vi.mock('@/core/services/toast-service', () => ({
  toastService: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/modules/inventory/components/ProductImageGallery', () => ({
  ProductImageGallery: () => null,
}));
vi.mock('@/modules/inventory/components/ProductBarcodeLabel', () => ({
  ProductBarcodeLabel: ({ barcode }: { barcode: string }) => <div data-testid="barcode-label">{barcode}</div>,
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

function getSheet() {
  return document.body.querySelector('.print-sheet');
}

function sheetCopies() {
  return getSheet()?.querySelectorAll('[data-testid="barcode-label"]').length ?? 0;
}

beforeEach(() => {
  window.print = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('product label printing', () => {
  it('renders one preview label and a print sheet with one copy by default', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Taladro percutor' });

    const sheet = getSheet();
    expect(sheet).not.toBeNull();
    expect(sheet!.parentElement).toBe(document.body);
    expect(sheetCopies()).toBe(1);

    const input = screen.getByRole('textbox', { name: 'Copias' }) as HTMLInputElement;
    expect(input.value).toBe('1');
    expect((screen.getByRole('button', { name: 'Quitar una copia' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText('×1')).toBeNull();
  });

  it('increments copies and mirrors them in the print sheet', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Taladro percutor' });

    const plus = screen.getByRole('button', { name: 'Agregar una copia' });
    fireEvent.click(plus);
    fireEvent.click(plus);
    fireEvent.click(plus);

    expect((screen.getByRole('textbox', { name: 'Copias' }) as HTMLInputElement).value).toBe('4');
    expect(sheetCopies()).toBe(4);
    expect(screen.getByText('×4')).toBeDefined();
  });

  it('clamps typed copies to the 1-100 range', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Taladro percutor' });
    const input = screen.getByRole('textbox', { name: 'Copias' });

    fireEvent.change(input, { target: { value: '20' } });
    expect(sheetCopies()).toBe(20);

    fireEvent.change(input, { target: { value: '150' } });
    expect((input as HTMLInputElement).value).toBe('100');
    expect(sheetCopies()).toBe(100);
    expect((screen.getByRole('button', { name: 'Agregar una copia' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(input, { target: { value: '0' } });
    expect((input as HTMLInputElement).value).toBe('1');
    expect((screen.getByRole('button', { name: 'Quitar una copia' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('supports arrow keys on the copies input', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Taladro percutor' });
    const input = screen.getByRole('textbox', { name: 'Copias' });

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect((input as HTMLInputElement).value).toBe('3');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect((input as HTMLInputElement).value).toBe('2');
    expect(sheetCopies()).toBe(2);
  });

  it('prints through window.print', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Taladro percutor' });

    fireEvent.click(screen.getByRole('button', { name: 'Imprimir etiqueta' }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('hides the stepper and print sheet when the product has no barcode', async () => {
    renderDetail('p-3');
    await screen.findByRole('heading', { name: 'Cable UTP cat6' });

    expect(screen.queryByRole('group', { name: 'Copias' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Imprimir etiqueta' })).toBeNull();
    expect(getSheet()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Generar código interno' })).toBeNull();
    expect(screen.getByText('El código de barras se genera automáticamente al crear el producto.')).toBeDefined();
  });
});
