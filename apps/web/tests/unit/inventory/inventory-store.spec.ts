import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '@/modules/inventory/store/inventory-store';

describe('inventory store', () => {
  beforeEach(() => {
    const { setFilter, setPage, setPageSize } = useInventoryStore.getState();
    setFilter('');
    setPage(1);
    setPageSize(50);
  });

  it('filters via setFilter and resets page to 1', () => {
    useInventoryStore.getState().setPage(3);
    useInventoryStore.getState().setFilter('test');
    expect(useInventoryStore.getState().filter).toBe('test');
    expect(useInventoryStore.getState().page).toBe(1);
  });

  it('resets page to 1 when page size changes', () => {
    useInventoryStore.getState().setPage(4);
    useInventoryStore.getState().setPageSize(25);
    expect(useInventoryStore.getState().pageSize).toBe(25);
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

  it('resets page to 1 when sorting changes', () => {
    useInventoryStore.getState().setPage(5);
    useInventoryStore.getState().setSort('name');
    expect(useInventoryStore.getState().page).toBe(1);
  });
});
