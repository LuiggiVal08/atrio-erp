import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface PosSession {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  userId: string;
  userName: string;
  openedAt: string;
  status: 'OPEN' | 'CLOSED';
  trainingMode: boolean;
}

export interface Customer {
  id: string;
  name: string;
  taxId: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MOBILE_PAYMENT';

export type PaymentStatus = 'IDLE' | 'VALIDATING_STOCK' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export interface PaymentState {
  status: PaymentStatus;
  error: string | null;
}

export type Zone = 'search' | 'cart' | 'customer' | 'payment';

export interface PosUIState {
  focusedZone: Zone;
  searchQuery: string;
  customerSearchOpen: boolean;
  customerSearchQuery: string;
  paymentOverlayOpen: boolean;
  saleResultOpen: boolean;
  selectedLineIndex: number;
  helpOpen: boolean;
}

interface PosStore {
  session: PosSession | null;
  cart: CartLine[];
  customer: Customer | null;
  payment: PaymentState;
  ui: PosUIState;

  openSession: (session: PosSession) => void;
  closeSession: () => void;
  setTrainingMode: (on: boolean) => void;

  addProduct: (product: { id: string; name: string; sku: string; barcode: string; price: number }) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;

  setCustomer: (customer: Customer | null) => void;

  setPaymentStatus: (status: PaymentStatus, error?: string | null) => void;
  resetPayment: () => void;

  setSearchQuery: (q: string) => void;
  setFocusedZone: (zone: Zone) => void;
  setCustomerSearchOpen: (open: boolean) => void;
  setCustomerSearchQuery: (q: string) => void;
  setPaymentOverlayOpen: (open: boolean) => void;
  setSaleResultOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setSelectedLineIndex: (index: number) => void;
  selectNextLine: () => void;
  selectPrevLine: () => void;
  selectLastLine: () => void;
  selectFirstLine: () => void;

  resetSale: () => void;
}

let lineCounter = 0;

function calcTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const taxRate = 0.16;
  const taxTotal = subtotal * taxRate;
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}

export const usePosStore = create<PosStore>()(
  persist(
    (set) => ({
      session: null,
      cart: [],
      customer: null,
      payment: {
        status: 'IDLE',
        error: null,
      },
      ui: {
        focusedZone: 'search',
        searchQuery: '',
        customerSearchOpen: false,
        customerSearchQuery: '',
        paymentOverlayOpen: false,
        saleResultOpen: false,
        helpOpen: false,
        selectedLineIndex: -1,
      },

      openSession: (session) => set({ session }),
      closeSession: () => set({ session: null }),
      setTrainingMode: (trainingMode) =>
        set((s) => ({
          session: s.session ? { ...s.session, trainingMode } : null,
        })),

      addProduct: (product) =>
        set((s) => {
          const existing = s.cart.find((l) => l.productId === product.id);
          if (existing) {
            const cart = s.cart.map((l) =>
              l.productId === product.id
                ? { ...l, quantity: l.quantity + 1, subtotal: (l.quantity + 1) * l.price }
                : l,
            );
            return { cart };
          }
          const id = `line-${++lineCounter}`;
          const cart = [
            ...s.cart,
            {
              id,
              productId: product.id,
              name: product.name,
              sku: product.sku,
              barcode: product.barcode,
              price: product.price,
              quantity: 1,
              subtotal: product.price,
            },
          ];
          return { cart };
        }),

      updateQuantity: (lineId, qty) =>
        set((s) => ({
          cart: s.cart.map((l) =>
            l.id === lineId ? { ...l, quantity: Math.max(1, qty), subtotal: Math.max(1, qty) * l.price } : l,
          ),
        })),

      removeLine: (lineId) =>
        set((s) => ({
          cart: s.cart.filter((l) => l.id !== lineId),
        })),

      clearCart: () => set({ cart: [] }),

      setCustomer: (customer) => set({ customer }),

      setPaymentStatus: (status, error = null) =>
        set((s) => ({
          payment: { ...s.payment, status, error },
        })),

      resetPayment: () =>
        set({
          payment: {
            status: 'IDLE',
            error: null,
          },
        }),

      setSearchQuery: (q) =>
        set((s) => ({
          ui: { ...s.ui, searchQuery: q },
        })),

      setFocusedZone: (zone) =>
        set((s) => ({
          ui: { ...s.ui, focusedZone: zone },
        })),

      setCustomerSearchOpen: (open) =>
        set((s) => ({
          ui: { ...s.ui, customerSearchOpen: open },
        })),

      setCustomerSearchQuery: (q) =>
        set((s) => ({
          ui: { ...s.ui, customerSearchQuery: q },
        })),

      setPaymentOverlayOpen: (open) =>
        set((s) => ({
          ui: { ...s.ui, paymentOverlayOpen: open },
        })),

      setSaleResultOpen: (open) =>
        set((s) => ({
          ui: { ...s.ui, saleResultOpen: open },
        })),

      setHelpOpen: (open) =>
        set((s) => ({
          ui: { ...s.ui, helpOpen: open },
        })),

      setSelectedLineIndex: (index) =>
        set((s) => ({
          ui: { ...s.ui, selectedLineIndex: index },
        })),

      selectNextLine: () =>
        set((s) => {
          const max = s.cart.length - 1;
          const next = s.ui.selectedLineIndex >= max ? 0 : s.ui.selectedLineIndex + 1;
          return { ui: { ...s.ui, selectedLineIndex: next } };
        }),

      selectPrevLine: () =>
        set((s) => {
          const max = s.cart.length - 1;
          const prev = s.ui.selectedLineIndex <= 0 ? max : s.ui.selectedLineIndex - 1;
          return { ui: { ...s.ui, selectedLineIndex: prev } };
        }),

      selectLastLine: () =>
        set((s) => ({
          ui: { ...s.ui, selectedLineIndex: Math.max(0, s.cart.length - 1) },
        })),

      selectFirstLine: () =>
        set((s) => ({
          ui: { ...s.ui, selectedLineIndex: s.cart.length > 0 ? 0 : -1 },
        })),

      resetSale: () => {
        set({
          cart: [],
          customer: null,
          payment: {
            status: 'IDLE',
            error: null,
          },
          ui: {
            focusedZone: 'search',
            searchQuery: '',
            customerSearchOpen: false,
            customerSearchQuery: '',
            paymentOverlayOpen: false,
            saleResultOpen: false,
            helpOpen: false,
            selectedLineIndex: -1,
          },
        });
      },
    }),
    {
      name: 'pos-store',
      partialize: (state) => ({
        session: state.session,
        cart: state.cart,
        customer: state.customer,
      }),
    },
  ),
);

export const usePosTotals = () => {
  const cart = usePosStore((s) => s.cart);
  return calcTotals(cart);
};
