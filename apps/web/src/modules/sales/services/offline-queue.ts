export interface OfflineTransaction {
  id: string;
  tenantId: string;
  branchId: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  total: number;
  paymentMethod: string;
  createdAt: string;
  syncedAt: string | null;
  retryCount: number;
}

const DB_NAME = 'atrio-pos-offline';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openDb();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const offlineQueue = {
  async save(tx: OfflineTransaction): Promise<void> {
    await withDb(async (db) => {
      const tx_ = db.transaction(STORE_NAME, 'readwrite');
      const store = tx_.objectStore(STORE_NAME);
      await promisifyRequest(store.add(tx));
    });
  },

  async getAll(): Promise<OfflineTransaction[]> {
    return withDb(async (db) => {
      const tx_ = db.transaction(STORE_NAME, 'readonly');
      const store = tx_.objectStore(STORE_NAME);
      return promisifyRequest(store.getAll());
    });
  },

  async getById(id: string): Promise<OfflineTransaction | undefined> {
    return withDb(async (db) => {
      const tx_ = db.transaction(STORE_NAME, 'readonly');
      const store = tx_.objectStore(STORE_NAME);
      return promisifyRequest(store.get(id));
    });
  },

  async getUnsynced(): Promise<OfflineTransaction[]> {
    const all = await this.getAll();
    return all.filter((tx) => tx.syncedAt === null);
  },

  async markSynced(id: string): Promise<void> {
    await withDb(async (db) => {
      const tx_ = db.transaction(STORE_NAME, 'readwrite');
      const store = tx_.objectStore(STORE_NAME);
      const record = await promisifyRequest(store.get(id));
      if (record) {
        record.syncedAt = new Date().toISOString();
        await promisifyRequest(store.put(record));
      }
    });
  },

  async remove(id: string): Promise<void> {
    await withDb(async (db) => {
      const tx_ = db.transaction(STORE_NAME, 'readwrite');
      const store = tx_.objectStore(STORE_NAME);
      await promisifyRequest(store.delete(id));
    });
  },

  async clearSynced(): Promise<void> {
    const all = await this.getAll();
    const synced = all.filter((tx) => tx.syncedAt !== null);
    for (const tx of synced) {
      await this.remove(tx.id);
    }
  },

  async clear(): Promise<void> {
    await withDb(async (db) => {
      const tx_ = db.transaction(STORE_NAME, 'readwrite');
      const store = tx_.objectStore(STORE_NAME);
      await promisifyRequest(store.clear());
    });
  },
};
