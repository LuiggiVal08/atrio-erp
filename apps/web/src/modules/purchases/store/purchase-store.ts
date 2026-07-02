import { create } from 'zustand';
import type { DocumentStatus } from '@/core/components/DocumentStateBadge';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  expectedDate: string;
  notes: string;
  status: DocumentStatus;
  items: PurchaseLineItem[];
  nationalization: NationalizationCosts;
  createdAt: string;
}

export interface PurchaseLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface NationalizationCosts {
  freight: number;
  insurance: number;
  customs: number;
  otherCosts: number;
}

interface PurchaseState {
  orders: PurchaseOrder[];
  createOrder: (data: { vendorId: string; vendorName: string; expectedDate: string }) => void;
  approveOrder: (id: string) => void;
  receiveOrder: (id: string) => void;
  updateNationalization: (orderId: string, costs: Partial<NationalizationCosts>) => void;
  clear: () => void;
}

let orderCounter = 0;

export const usePurchaseStore = create<PurchaseState>((set) => ({
  orders: [],

  createOrder: (data) =>
    set((s) => ({
      orders: [
        ...s.orders,
        {
          id: `po-${++orderCounter}`,
          orderNumber: `OC-${String(orderCounter).padStart(5, '0')}`,
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          expectedDate: data.expectedDate,
          notes: '',
          status: 'draft',
          items: [],
          nationalization: { freight: 0, insurance: 0, customs: 0, otherCosts: 0 },
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  approveOrder: (id) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'approved' as DocumentStatus } : o)),
    })),

  receiveOrder: (id) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'received' as DocumentStatus } : o)),
    })),

  updateNationalization: (orderId, costs) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, nationalization: { ...o.nationalization, ...costs } } : o,
      ),
    })),

  clear: () => set({ orders: [] }),
}));
