import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  activeTenantId: string | null;
  setActiveTenant: (id: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenantId: null,
      setActiveTenant: (id) => set({ activeTenantId: id }),
      clearTenant: () => set({ activeTenantId: null }),
    }),
    { name: 'atrio-tenant' },
  ),
);
