import { create } from 'zustand';

export interface POSLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'digital' | 'card' | 'other';

export interface PaymentAllocation {
  method: PaymentMethod;
  amount: number;
  currency: string;
  exchangeRate: number;
  bankName?: string;
  reference?: string;
  details?: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface POSState {
  items: POSLineItem[];
  total: number;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  paymentMethod: PaymentMethod | null;
  paymentAllocations: PaymentAllocation[];
  isOffline: boolean;
  isBlockedByAudit: boolean;
  searchQuery: string;
  searchFocused: boolean;

  addItem: (product: ProductSearchResult) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setPaymentAllocations: (allocations: PaymentAllocation[]) => void;
  clearCart: () => void;
  setSearchQuery: (q: string) => void;
  setSearchFocused: (focused: boolean) => void;
  setOffline: (offline: boolean) => void;
  setBlockedByAudit: (blocked: boolean) => void;
}

let lineCounter = 0;

function recalc(items: POSLineItem[]): { subtotal: number; total: number } {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  return { subtotal, total: subtotal };
}

export const usePOSStore = create<POSState>((set) => ({
  items: [],
  total: 0,
  subtotal: 0,
  taxTotal: 0,
  discountTotal: 0,
  paymentMethod: null,
  paymentAllocations: [],
  isOffline: false,
  isBlockedByAudit: false,
  searchQuery: '',
  searchFocused: false,

  addItem: (product) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === product.id);
      if (existing) {
        const items = s.items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i,
        );
        const { subtotal, total } = recalc(items);
        return { items, subtotal, total };
      }
      const id = `line-${++lineCounter}`;
      const items = [
        ...s.items,
        {
          id,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ];
      const { subtotal, total } = recalc(items);
      return { items, subtotal, total };
    }),

  removeItem: (lineId) =>
    set((s) => {
      const items = s.items.filter((i) => i.id !== lineId);
      const { subtotal, total } = recalc(items);
      return { items, subtotal, total };
    }),

  updateQuantity: (lineId, qty) =>
    set((s) => {
      const items = s.items.map((i) =>
        i.id === lineId ? { ...i, quantity: qty, subtotal: qty * i.unitPrice } : i,
      );
      const { subtotal, total } = recalc(items);
      return { items, subtotal, total };
    }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setPaymentAllocations: (allocations) => set({ paymentAllocations: allocations }),

  clearCart: () =>
    set({
      items: [],
      total: 0,
      subtotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      paymentMethod: null,
      paymentAllocations: [],
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchFocused: (focused) => set({ searchFocused: focused }),

  setOffline: (offline) => set({ isOffline: offline }),

  setBlockedByAudit: (blocked) => set({ isBlockedByAudit: blocked }),
}));
