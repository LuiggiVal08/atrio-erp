import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '@/modules/inventory/store/inventory-store';
import type { InventoryProduct } from '@/modules/inventory/store/inventory-store';

const mockProduct = (overrides?: Partial<InventoryProduct>): InventoryProduct => ({
  id: '1',
  sku: 'SKU-001',
  name: 'Test Product',
  category: 'General',
  stock: 10,
  unitPrice: 100,
  averageCost: 80,
  status: 'draft',
  ...overrides,
});

describe('inventory store', () => {
  beforeEach(() => {
    const { setProducts, setFilter, setPage, setLoading } = useInventoryStore.getState();
    setProducts([], 0);
    setFilter('');
    setPage(1);
    setLoading(false);
  });

  it('adds products via setProducts', () => {
    const products = [mockProduct()];
    useInventoryStore.getState().setProducts(products, 1);
    const state = useInventoryStore.getState();
    expect(state.products).toHaveLength(1);
    expect(state.total).toBe(1);
    expect(state.loading).toBe(false);
  });

  it('updates product status via updateStatus', () => {
    const products = [mockProduct({ id: '1', status: 'draft' })];
    useInventoryStore.getState().setProducts(products, 1);
    useInventoryStore.getState().updateStatus('1', 'approved');
    expect(useInventoryStore.getState().products[0].status).toBe('approved');
  });

  it('filters via setFilter and resets page to 1', () => {
    useInventoryStore.getState().setPage(3);
    useInventoryStore.getState().setFilter('test');
    expect(useInventoryStore.getState().filter).toBe('test');
    expect(useInventoryStore.getState().page).toBe(1);
  });

  it('toggles sort direction when same column is clicked', () => {
    useInventoryStore.getState().setSort('name');
    expect(useInventoryStore.getState().sortColumn).toBe('name');
    expect(useInventoryStore.getState().sortDirection).toBe('asc');

    useInventoryStore.getState().setSort('name');
    expect(useInventoryStore.getState().sortColumn).toBe('name');
    expect(useInventoryStore.getState().sortDirection).toBe('desc');
  });

  it('sets ascending sort when different column is selected', () => {
    useInventoryStore.getState().setSort('name');
    useInventoryStore.getState().setSort('stock');
    expect(useInventoryStore.getState().sortColumn).toBe('stock');
    expect(useInventoryStore.getState().sortDirection).toBe('asc');
  });
});
