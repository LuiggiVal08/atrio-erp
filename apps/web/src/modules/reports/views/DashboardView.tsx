import { useState } from 'react';
import { DollarSign, TrendingUp, Users, Package, Wallet, Clock, BarChart3, PieChart } from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboard';
import { KpiCard } from '../components/KpiCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { TopProductsChart } from '../components/TopProductsChart';
import { LowStockTable } from '../components/LowStockTable';

type DashboardSection = 'kpis' | 'trend' | 'products' | 'stock';

const defaultLayout: DashboardSection[] = ['kpis', 'trend', 'products', 'stock'];

const sectionLabels: Record<DashboardSection, string> = {
  kpis: 'Indicadores Clave',
  trend: 'Tendencia de Ventas',
  products: 'Top Productos',
  stock: 'Stock Bajo',
};

const sectionIcons: Record<DashboardSection, React.ReactNode> = {
  kpis: <BarChart3 size={14} />,
  trend: <TrendingUp size={14} />,
  products: <PieChart size={14} />,
  stock: <Package size={14} />,
};

export function DashboardView() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const [layout, setLayout] = useState<DashboardSection[]>(defaultLayout);
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);

  function toggleSection(section: DashboardSection) {
    setLayout((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Dashboard Ejecutivo</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Resumen del negocio en tiempo real</p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="relative">
        <button
          onClick={() => setShowWidgetMenu(!showWidgetMenu)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
        >
          + Widgets
        </button>
        {showWidgetMenu && (
          <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg">
            <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Mostrar / Ocultar
            </p>
            {(Object.keys(sectionLabels) as DashboardSection[]).map((section) => (
              <label
                key={section}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-primary hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={layout.includes(section)}
                  onChange={() => toggleSection(section)}
                  className="rounded border-border text-accent"
                />
                <span className="flex items-center gap-1.5">
                  {sectionIcons[section]}
                  {sectionLabels[section]}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {layout.map((section) => {
        switch (section) {
          case 'kpis':
            return (
              <section key="kpis">
                <h2 className="mb-3 text-sm font-semibold text-text-primary">{sectionLabels.kpis}</h2>
                {summaryLoading ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <KpiCard
                      title="Ventas Hoy"
                      value={summary?.todaySales ?? 0}
                      icon={DollarSign}
                      color="accent"
                    />
                    <KpiCard
                      title="Ventas del Mes"
                      value={summary?.monthSales ?? 0}
                      change={summary?.salesChange}
                      icon={TrendingUp}
                      color="success"
                    />
                    <KpiCard
                      title="Clientes Activos"
                      value={summary?.activeClients ?? 0}
                      icon={Users}
                      color="accent"
                    />
                    <KpiCard
                      title="Stock Bajo"
                      value={summary?.lowStockProducts ?? 0}
                      icon={Package}
                      color="warning"
                    />
                    <KpiCard
                      title="Movs. Caja Hoy"
                      value={summary?.todayCashMovements ?? 0}
                      icon={Wallet}
                      color="accent"
                    />
                    <KpiCard
                      title="Órdenes Pendientes"
                      value={summary?.pendingOrders ?? 0}
                      icon={Clock}
                      color="error"
                    />
                  </div>
                )}
              </section>
            );

          case 'trend':
            return (
              <section key="trend" className="rounded-xl border border-border bg-surface p-4">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">
                  {sectionLabels.trend}
                </h2>
                <SalesTrendChart />
              </section>
            );

          case 'products':
            return (
              <section key="products" className="rounded-xl border border-border bg-surface p-4">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">
                  {sectionLabels.products}
                </h2>
                <TopProductsChart />
              </section>
            );

          case 'stock':
            return (
              <section key="stock" className="rounded-xl border border-border bg-surface p-4">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">
                  {sectionLabels.stock}
                </h2>
                <LowStockTable />
              </section>
            );
        }
      })}
    </div>
  );
}
