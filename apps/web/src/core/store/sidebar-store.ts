import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';

export interface ModuleEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  permissions: string[];
  badge?: number;
}

interface SidebarState {
  isCollapsed: boolean;
  modules: ModuleEntry[];
  activeModule: string | null;
  toggleCollapse: () => void;
  setModules: (modules: ModuleEntry[]) => void;
  setActiveModule: (moduleId: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: true,
  modules: [],
  activeModule: null,
  toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setModules: (modules) => set({ modules }),
  setActiveModule: (moduleId) => set({ activeModule: moduleId }),
}));
