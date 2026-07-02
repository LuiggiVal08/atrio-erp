import { create } from 'zustand';

export interface DateRange {
  from: string;
  to: string;
  preset: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';
}

interface ReportsState {
  dateRange: DateRange;
  selectedView: 'dashboard' | 'history' | 'definitions';
  setDateRange: (range: DateRange) => void;
  setSelectedView: (view: ReportsState['selectedView']) => void;
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

export const useReportsStore = create<ReportsState>((set) => ({
  dateRange: getPresetRange('thisMonth'),
  selectedView: 'dashboard',
  setDateRange: (range) => set({ dateRange: range }),
  setSelectedView: (view) => set({ selectedView: view }),
}));
