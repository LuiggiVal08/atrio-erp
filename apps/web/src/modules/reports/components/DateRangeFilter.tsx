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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-border p-0.5">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
          />
          <span className="text-xs text-text-secondary">a</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
          />
        </div>
      )}
    </div>
  );
}
