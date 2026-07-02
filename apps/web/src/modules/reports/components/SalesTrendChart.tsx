import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useSalesTrend } from '../hooks/useDashboard';
import { useReportsStore } from '../store/reports-store';

export function SalesTrendChart() {
  const { dateRange } = useReportsStore();
  const { data, isLoading } = useSalesTrend(dateRange.from, dateRange.to);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
        No hay datos de ventas para el período seleccionado
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
    total: Number(d.total),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-thin)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border-thin)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border-thin)' }}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-thin)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: any) => [
              Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
              'Total',
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            dataKey="total"
            fill="var(--accent-main)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
