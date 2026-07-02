import { create } from 'zustand';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderState {
  breadcrumbs: Breadcrumb[];
  tenantName: string | null;
  branchName: string | null;
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
  setTenant: (name: string) => void;
  setBranch: (name: string) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  breadcrumbs: [],
  tenantName: null,
  branchName: null,
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setTenant: (tenantName) => set({ tenantName }),
  setBranch: (branchName) => set({ branchName }),
}));
