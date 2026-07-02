import { describe, it, expect, beforeEach } from 'vitest';
import { usePurchaseStore } from '@/modules/purchases/store/purchase-store';

describe('purchase store', () => {
  beforeEach(() => {
    usePurchaseStore.getState().clear();
  });

  it('starts with empty orders', () => {
    const state = usePurchaseStore.getState();
    expect(state.orders).toHaveLength(0);
  });

  it('creates a purchase order', () => {
    usePurchaseStore.getState().createOrder({ vendorId: 'v-1', vendorName: 'Vendor A', expectedDate: '2026-08-01' });
    const state = usePurchaseStore.getState();
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0].vendorName).toBe('Vendor A');
    expect(state.orders[0].status).toBe('draft');
  });

  it('approves a purchase order', () => {
    usePurchaseStore.getState().createOrder({ vendorId: 'v-1', vendorName: 'Vendor A', expectedDate: '2026-08-01' });
    const id = usePurchaseStore.getState().orders[0].id;
    usePurchaseStore.getState().approveOrder(id);
    expect(usePurchaseStore.getState().orders[0].status).toBe('approved');
  });

  it('receives a purchase order', () => {
    usePurchaseStore.getState().createOrder({ vendorId: 'v-1', vendorName: 'Vendor A', expectedDate: '2026-08-01' });
    const id = usePurchaseStore.getState().orders[0].id;
    usePurchaseStore.getState().approveOrder(id);
    usePurchaseStore.getState().receiveOrder(id);
    expect(usePurchaseStore.getState().orders[0].status).toBe('received');
  });

  it('clears all orders', () => {
    usePurchaseStore.getState().createOrder({ vendorId: 'v-1', vendorName: 'Vendor A', expectedDate: '2026-08-01' });
    usePurchaseStore.getState().clear();
    expect(usePurchaseStore.getState().orders).toHaveLength(0);
  });
});
