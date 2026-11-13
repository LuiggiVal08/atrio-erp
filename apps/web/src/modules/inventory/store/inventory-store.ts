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
  filter: string;
  sortColumn: keyof InventoryProduct | null;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
  setFilter: (filter: string) => void;
  setSort: (column: keyof InventoryProduct) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  filter: '',
  sortColumn: null,
  sortDirection: 'asc',
  page: 1,
  pageSize: 50,
  setFilter: (filter) => set({ filter, page: 1 }),
  setSort: (column) =>
    set((s) => ({
      sortColumn: column,
      sortDirection: s.sortColumn === column && s.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1,
    })),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
}));
