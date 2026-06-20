import { create } from 'zustand';

interface TenantState {
  activeTenantId: string | null;
  setActiveTenant: (id: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  activeTenantId: null,
  setActiveTenant: (id) => set({ activeTenantId: id }),
  clearTenant: () => set({ activeTenantId: null }),
}));
