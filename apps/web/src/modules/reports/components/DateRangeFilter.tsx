import { useReportsStore, type DateRange } from '../store/reports-store';

const presets: { label: string; value: DateRange['preset'] }[] = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta Semana', value: 'thisWeek' },
  { label: 'Este Mes', value: 'thisMonth' },
  { label: 'Mes Anterior', value: 'lastMonth' },
  { label: 'Personalizado', value: 'custom' },
];

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useReportsStore();

  function handlePreset(preset: DateRange['preset']) {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        setDateRange({ from: fmt(now), to: fmt(now), preset });
        break;
      case 'thisWeek': {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        setDateRange({ from: fmt(start), to: fmt(now), preset });
        break;
      }
      case 'thisMonth': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateRange({ from: fmt(start), to: fmt(now), preset });
        break;
      }
      case 'lastMonth': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateRange({ from: fmt(start), to: fmt(end), preset });
        break;
      }
      case 'custom':
        setDateRange({ ...dateRange, preset: 'custom' });
        break;
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
      <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border p-0.5 sm:flex sm:w-auto">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            aria-pressed={dateRange.preset === p.value}
            className={`min-h-11 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:min-h-9 ${
              dateRange.preset === p.value
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {dateRange.preset === 'custom' && (
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto">
          <label className="sr-only" htmlFor="dashboard-date-from">
            Fecha desde
          </label>
          <input
            id="dashboard-date-from"
            type="date"
            value={dateRange.from}
            max={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="min-h-11 min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-xs text-text-primary sm:min-h-9 sm:px-3"
          />
          <span className="text-xs text-text-secondary">a</span>
          <label className="sr-only" htmlFor="dashboard-date-to">
            Fecha hasta
          </label>
          <input
            id="dashboard-date-to"
            type="date"
            value={dateRange.to}
            min={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="min-h-11 min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-xs text-text-primary sm:min-h-9 sm:px-3"
          />
        </div>
      )}
    </div>
  );
}
