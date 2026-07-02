import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { offlineQueue } from '@/modules/sales/services/offline-queue';
import type { OfflineTransaction } from '@/modules/sales/services/offline-queue';

beforeAll(async () => {
  const { indexedDB } = await import('fake-indexeddb');
  globalThis.indexedDB = indexedDB;
});

const mockTx = (overrides?: Partial<OfflineTransaction>): OfflineTransaction => ({
  id: 'tx-1',
  tenantId: 'tenant-1',
  branchId: 'branch-1',
  items: [{ id: 'line-1', productId: 'prod-1', productName: 'Test', sku: 'SKU-1', quantity: 1, unitPrice: 100, subtotal: 100 }],
  total: 100,
  paymentMethod: 'cash',
  createdAt: new Date().toISOString(),
  syncedAt: null,
  retryCount: 0,
  ...overrides,
});

describe('offline queue', () => {
  beforeEach(async () => {
    await offlineQueue.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('saves a transaction to the queue', async () => {
    const tx = mockTx();
    await offlineQueue.save(tx);
    const all = await offlineQueue.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('tx-1');
  });

  it('loads all unsynced transactions', async () => {
    await offlineQueue.save(mockTx({ id: 'tx-1', syncedAt: null }));
    await offlineQueue.save(mockTx({ id: 'tx-2', syncedAt: new Date().toISOString() }));
    await offlineQueue.save(mockTx({ id: 'tx-3', syncedAt: null }));
    const unsynced = await offlineQueue.getUnsynced();
    expect(unsynced).toHaveLength(2);
  });

  it('marks a transaction as synced', async () => {
    await offlineQueue.save(mockTx({ id: 'tx-1', syncedAt: null }));
    await offlineQueue.markSynced('tx-1');
    const tx = await offlineQueue.getById('tx-1');
    expect(tx?.syncedAt).not.toBeNull();
  });

  it('removes a transaction from the queue', async () => {
    await offlineQueue.save(mockTx({ id: 'tx-1' }));
    await offlineQueue.remove('tx-1');
    const all = await offlineQueue.getAll();
    expect(all).toHaveLength(0);
  });

  it('clears all synced transactions', async () => {
    await offlineQueue.save(mockTx({ id: 'tx-1', syncedAt: new Date().toISOString() }));
    await offlineQueue.save(mockTx({ id: 'tx-2', syncedAt: null }));
    await offlineQueue.clearSynced();
    const all = await offlineQueue.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('tx-2');
  });
});
