import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DateRange {
  from: string;
  to: string;
  preset: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';
}

export type DashboardSection = 'kpis' | 'calendar' | 'trend' | 'products' | 'stock';

export const DEFAULT_DASHBOARD_LAYOUT: DashboardSection[] = [
  'kpis',
  'calendar',
  'trend',
  'products',
  'stock',
];

interface ReportsState {
  dateRange: DateRange;
  selectedView: 'dashboard' | 'history' | 'definitions';
  dashboardLayouts: Record<string, DashboardSection[]>;
  setDateRange: (range: DateRange) => void;
  setSelectedView: (view: ReportsState['selectedView']) => void;
  getDashboardLayout: (scopeKey: string) => DashboardSection[];
  setDashboardLayout: (scopeKey: string, layout: DashboardSection[]) => void;
  reorderDashboardSection: (scopeKey: string, from: number, to: number) => void;
  toggleDashboardSection: (scopeKey: string, section: DashboardSection) => void;
}

function getPresetRange(preset: DateRange['preset']): DateRange {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today': {
      return { from: fmt(now), to: fmt(now), preset };
    }
    case 'thisWeek': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { from: fmt(start), to: fmt(now), preset };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(start), to: fmt(now), preset };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(start), to: fmt(end), preset };
    }
    default:
      return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now), preset: 'thisMonth' };
  }
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      dateRange: getPresetRange('thisMonth'),
      selectedView: 'dashboard',
      dashboardLayouts: {},
      setDateRange: (range) => set({ dateRange: range }),
      setSelectedView: (view) => set({ selectedView: view }),
      getDashboardLayout: (scopeKey) =>
        get().dashboardLayouts[scopeKey] ?? DEFAULT_DASHBOARD_LAYOUT,
      setDashboardLayout: (scopeKey, layout) =>
        set((state) => ({
          dashboardLayouts: { ...state.dashboardLayouts, [scopeKey]: layout },
        })),
      reorderDashboardSection: (scopeKey, from, to) =>
        set((state) => {
          const layout = state.dashboardLayouts[scopeKey] ?? DEFAULT_DASHBOARD_LAYOUT;
          if (
            from === to ||
            from < 0 ||
            to < 0 ||
            from >= layout.length ||
            to >= layout.length
          ) {
            return state;
          }

          const next = [...layout];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);

          return {
            dashboardLayouts: { ...state.dashboardLayouts, [scopeKey]: next },
          };
        }),
      toggleDashboardSection: (scopeKey, section) =>
        set((state) => {
          const layout = state.dashboardLayouts[scopeKey] ?? DEFAULT_DASHBOARD_LAYOUT;
          const next = layout.includes(section)
            ? layout.filter((s) => s !== section)
            : [...layout, section];

          return {
            dashboardLayouts: { ...state.dashboardLayouts, [scopeKey]: next },
          };
        }),
    }),
    {
      name: 'atrio-reports',
      partialize: (state) => ({ dashboardLayouts: state.dashboardLayouts }),
    },
  ),
);
