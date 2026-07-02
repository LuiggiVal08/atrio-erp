import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTopProducts } from '../hooks/useDashboard';

export function TopProductsChart() {
  const { data, isLoading } = useTopProducts(8);

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
        No hay datos de productos para mostrar
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    name: d.product.length > 20 ? d.product.slice(0, 20) + '...' : d.product,
    total: Number(d.total),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-thin)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border-thin)' }}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)
            }
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={110}
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
          <Bar
            dataKey="total"
            fill="var(--accent-main)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
