import { create } from 'zustand';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  unitPrice: number;
  averageCost: number;
  isActive: boolean;
  status: DocumentStatus;
}

interface InventoryState {
  products: InventoryProduct[];
  filter: string;
  sortColumn: keyof InventoryProduct | null;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  setFilter: (filter: string) => void;
  setSort: (column: keyof InventoryProduct) => void;
  setPage: (page: number) => void;
  setProducts: (products: InventoryProduct[], total: number) => void;
  setLoading: (loading: boolean) => void;
  updateStatus: (id: string, status: DocumentStatus) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  products: [],
  filter: '',
  sortColumn: null,
  sortDirection: 'asc',
  page: 1,
  pageSize: 50,
  total: 0,
  loading: false,
  setFilter: (filter) => set({ filter, page: 1 }),
  setSort: (column) =>
    set((s) => ({
      sortColumn: column,
      sortDirection: s.sortColumn === column && s.sortDirection === 'asc' ? 'desc' : 'asc',
    })),
  setPage: (page) => set({ page }),
  setProducts: (products, total) => set({ products, total, loading: false }),
  setLoading: (loading) => set({ loading }),
  updateStatus: (id, status) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
}));
