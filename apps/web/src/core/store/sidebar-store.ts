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
  isCollapsed: false,
  modules: [],
  activeModule: null,
  toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setModules: (modules) =>
    set((s) => {
      const merged = new Map(s.modules.map((m) => [m.id, m]));
      for (const m of modules) merged.set(m.id, m);
      return { modules: [...merged.values()] };
    }),
  setActiveModule: (moduleId) => set({ activeModule: moduleId }),
}));
