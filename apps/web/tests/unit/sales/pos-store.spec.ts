import { describe, it, expect, beforeEach } from 'vitest';
import { usePOSStore } from '@/modules/sales/store/pos-store';

const mockProduct = (overrides?: Record<string, unknown>) => ({
  id: 'prod-1',
  name: 'Test Product',
  sku: 'SKU-001',
  price: 100,
  ...overrides,
});

describe('POS store', () => {
  beforeEach(() => {
    usePOSStore.getState().clearCart();
    usePOSStore.getState().setSearchQuery('');
    usePOSStore.getState().setOffline(false);
  });

  it('starts with empty cart', () => {
    const state = usePOSStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.paymentMethod).toBeNull();
    expect(state.isOffline).toBe(false);
  });

  it('adds item to cart', () => {
    usePOSStore.getState().addItem(mockProduct());
    const state = usePOSStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productName).toBe('Test Product');
    expect(state.items[0].quantity).toBe(1);
  });

  it('increments quantity when same product is added twice', () => {
    usePOSStore.getState().addItem(mockProduct());
    usePOSStore.getState().addItem(mockProduct());
    const state = usePOSStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('calculates subtotal on add', () => {
    usePOSStore.getState().addItem(mockProduct({ price: 50 }));
    usePOSStore.getState().addItem(mockProduct({ price: 50 }));
    expect(usePOSStore.getState().items[0].subtotal).toBe(100);
  });

  it('removes item from cart', () => {
    usePOSStore.getState().addItem(mockProduct());
    const id = usePOSStore.getState().items[0].id;
    usePOSStore.getState().removeItem(id);
    expect(usePOSStore.getState().items).toHaveLength(0);
  });

  it('updates item quantity', () => {
    usePOSStore.getState().addItem(mockProduct());
    const id = usePOSStore.getState().items[0].id;
    usePOSStore.getState().updateQuantity(id, 5);
    expect(usePOSStore.getState().items[0].quantity).toBe(5);
    expect(usePOSStore.getState().items[0].subtotal).toBe(500);
  });

  it('recalculates total after quantity change', () => {
    usePOSStore.getState().addItem(mockProduct({ price: 100 }));
    usePOSStore.getState().addItem(mockProduct({ id: 'prod-2', name: 'Other', sku: 'SKU-002', price: 50 }));
    const id = usePOSStore.getState().items[0].id;
    usePOSStore.getState().updateQuantity(id, 3);
    const state = usePOSStore.getState();
    expect(state.total).toBe(350);
  });

  it('sets payment method', () => {
    usePOSStore.getState().setPaymentMethod('cash');
    expect(usePOSStore.getState().paymentMethod).toBe('cash');
  });

  it('clears cart', () => {
    usePOSStore.getState().addItem(mockProduct());
    usePOSStore.getState().setPaymentMethod('card');
    usePOSStore.getState().clearCart();
    const state = usePOSStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.paymentMethod).toBeNull();
  });

  it('toggles offline flag', () => {
    usePOSStore.getState().setOffline(true);
    expect(usePOSStore.getState().isOffline).toBe(true);
    usePOSStore.getState().setOffline(false);
    expect(usePOSStore.getState().isOffline).toBe(false);
  });
});
