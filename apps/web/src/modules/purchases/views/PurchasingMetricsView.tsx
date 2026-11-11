import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, PackageCheck, Tags, Truck } from 'lucide-react';
import { Drawer } from '@heroui/react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useTenantStore } from '@/core/tenant/store';
import { useTenant } from '@/modules/settings/hooks/useTenant';
import { EmptyState } from '@/core/components/EmptyState';
import {
  useDeliveryMetrics,
  usePendingDeliveries,
  useSpendByCategory,
  useVendorDeliveryHistory,
  type DeliveryMetricRow,
  type DeliveryTiming,
} from '../hooks/usePurchasingMetrics';

const inputClass = 'rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none';

type TimingFilter = 'all' | 'early' | 'onTime' | 'late';
type SortKey = 'orders' | 'compliance' | 'delay' | 'spend' | 'last';
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

function pct(part: number, total: number): string {
  if (!total) return '—';
  return `${Math.round((part / total) * 100)}%`;
}

function complianceRate(row: DeliveryMetricRow): number | null {
  const classified = row.early + row.onTime + row.late;
  return classified ? (row.early + row.onTime) / classified : null;
}

function formatDelay(value: number | null): string {
  if (value == null) return '—';
  return `${value > 0 ? '+' : ''}${value} d`;
}

export function PurchasingMetricsView() {
  const { locale } = useTranslation();
  const navigate = useNavigate();
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const { data: tenant } = useTenant(tenantId);
  const currency = tenant?.baseCurrency === 'VED' ? 'VES' : (tenant?.baseCurrency || 'VES');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [timingFilter, setTimingFilter] = useState<TimingFilter>('all');
  const [sort, setSort] = useState<SortState>({ key: 'orders', dir: 'desc' });
  const [selectedVendor, setSelectedVendor] = useState<DeliveryMetricRow | null>(null);
  const [pendingOnlyOverdue, setPendingOnlyOverdue] = useState(false);

  const range = { from: from || undefined, to: to || undefined };
  const delivery = useDeliveryMetrics(range);
  const spend = useSpendByCategory(range);
  const pending = usePendingDeliveries(range);
  const history = useVendorDeliveryHistory(selectedVendor?.vendorId ?? null, range);

  const numberFmt = new Intl.NumberFormat(locale);
  const formatMoney = (value: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${numberFmt.format(value)} ${currency}`;
    }
  };
  const formatDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const formatShortDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleDateString(locale, { day: '2-digit', month: 'short' }) : '—';

  const deliveryRows = useMemo(() => delivery.data ?? [], [delivery.data]);
  const spendRows = useMemo(() => spend.data ?? [], [spend.data]);
  const pendingRows = useMemo(() => pending.data ?? [], [pending.data]);
  const historyRows = useMemo(() => history.data ?? [], [history.data]);

  const totals = useMemo(() => {
    const orders = deliveryRows.reduce((sum, row) => sum + row.orders, 0);
    const early = deliveryRows.reduce((sum, row) => sum + row.early, 0);
    const onTime = deliveryRows.reduce((sum, row) => sum + row.onTime, 0);
    const late = deliveryRows.reduce((sum, row) => sum + row.late, 0);
    const unknown = deliveryRows.reduce((sum, row) => sum + row.unknown, 0);
    const classified = early + onTime + late;
    const compliance = classified ? (early + onTime) / classified : null;
    const delay = deliveryRows.reduce(
      (acc, row) => {
        if (row.avgDelayDays == null) return acc;
        const weight = row.early + row.onTime + row.late;
        if (!weight) return acc;
        return { sum: acc.sum + row.avgDelayDays * weight, weight: acc.weight + weight };
      },
      { sum: 0, weight: 0 },
    );
    return {
      orders,
      early,
      onTime,
      late,
      unknown,
      classified,
      compliance,
      avgDelay: delay.weight ? delay.sum / delay.weight : null,
    };
  }, [deliveryRows]);

  const spendOrders = spendRows.reduce((sum, row) => sum + row.orders, 0);
  const totalSpend = spendRows.reduce((sum, row) => sum + row.totalSpend, 0);
  const pendingOrders = pendingRows.length;
  const overdueOrders = pendingRows.filter((row) => row.daysUntilDue != null && row.daysUntilDue < 0).length;

  const filterOptions: { key: TimingFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: deliveryRows.length },
    { key: 'early', label: 'Anticipadas', count: deliveryRows.filter((row) => row.early > 0).length },
    { key: 'onTime', label: 'A tiempo', count: deliveryRows.filter((row) => row.onTime > 0).length },
    { key: 'late', label: 'Con demora', count: deliveryRows.filter((row) => row.late > 0).length },
  ];

  const filteredRows = useMemo(() => {
    if (timingFilter === 'early') return deliveryRows.filter((row) => row.early > 0);
    if (timingFilter === 'onTime') return deliveryRows.filter((row) => row.onTime > 0);
    if (timingFilter === 'late') return deliveryRows.filter((row) => row.late > 0);
    return deliveryRows;
  }, [deliveryRows, timingFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    const dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sort.key === 'orders') return (a.orders - b.orders) * dir;
      if (sort.key === 'compliance') return ((complianceRate(a) ?? -1) - (complianceRate(b) ?? -1)) * dir;
      if (sort.key === 'delay') return ((a.avgDelayDays ?? 0) - (b.avgDelayDays ?? 0)) * dir;
      if (sort.key === 'spend') return (a.totalSpend - b.totalSpend) * dir;
      const at = a.lastReceivedAt ? new Date(a.lastReceivedAt).getTime() : 0;
      const bt = b.lastReceivedAt ? new Date(b.lastReceivedAt).getTime() : 0;
      return (at - bt) * dir;
    });
    return rows;
  }, [filteredRows, sort]);

  const pendingFiltered = useMemo(
    () => (pendingOnlyOverdue ? pendingRows.filter((row) => row.daysUntilDue != null && row.daysUntilDue < 0) : pendingRows),
    [pendingRows, pendingOnlyOverdue],
  );

  const toggleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  };

  const deliveryReady = !delivery.isLoading && !delivery.isError;
  const spendReady = !spend.isLoading && !spend.isError;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Métricas de proveedores</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Puntualidad de entrega, entregas pendientes y gasto por categoría.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Desde</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <span aria-hidden="true" className="text-text-secondary">–</span>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Hasta</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={() => { setFrom(''); setTo(''); }}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 rounded-xl border border-border bg-surface px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Órdenes recibidas"
          value={deliveryReady ? numberFmt.format(totals.orders) : '—'}
          hint={deliveryReady && totals.classified ? `${numberFmt.format(totals.classified)} clasificadas` : undefined}
        />
        <Stat
          label="Cumplimiento"
          value={deliveryReady && totals.compliance != null ? `${Math.round(totals.compliance * 100)}%` : '—'}
          hint={
            deliveryReady && totals.classified
              ? `${numberFmt.format(totals.early + totals.onTime)} de ${numberFmt.format(totals.classified)} a tiempo o antes`
              : undefined
          }
          tone={deliveryReady && totals.compliance != null ? (totals.compliance >= 0.8 ? 'success' : 'error') : undefined}
        />
        <Stat
          label="Desvío promedio"
          value={deliveryReady && totals.avgDelay != null ? `${totals.avgDelay > 0 ? '+' : ''}${totals.avgDelay.toFixed(1)} d` : '—'}
          hint="Negativo = entrega anticipada"
          tone={deliveryReady && totals.avgDelay != null ? (totals.avgDelay > 0 ? 'error' : 'success') : undefined}
        />
        <Stat
          label="Gasto total"
          value={spendReady ? formatMoney(totalSpend) : '—'}
          hint={spendReady ? `${numberFmt.format(spendOrders)} órdenes · ${numberFmt.format(pendingOrders)} pendientes` : undefined}
        />
      </div>

      {deliveryReady && deliveryRows.length > 0 && (
        <section className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Salud de entregas</h2>
              <p className="mt-0.5 text-xs text-text-secondary">Clasificación de las órdenes recibidas en el período.</p>
            </div>
            <span className="text-xs text-text-secondary">
              {numberFmt.format(totals.classified)} clasificadas
              {totals.unknown > 0 ? ` · ${numberFmt.format(totals.unknown)} sin referencia` : ''}
            </span>
          </div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-surface-hover" aria-hidden="true">
            <div className="bg-info" style={{ width: `${totals.classified ? (totals.early / totals.classified) * 100 : 0}%` }} />
            <div className="bg-success" style={{ width: `${totals.classified ? (totals.onTime / totals.classified) * 100 : 0}%` }} />
            <div className="bg-error" style={{ width: `${totals.classified ? (totals.late / totals.classified) * 100 : 0}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-secondary">
            <Legend color="bg-info" label="Anticipadas" count={totals.early} total={totals.classified} />
            <Legend color="bg-success" label="A tiempo" count={totals.onTime} total={totals.classified} />
            <Legend color="bg-error" label="Con demora" count={totals.late} total={totals.classified} />
          </div>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Puntualidad por proveedor</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Haz clic en un proveedor para ver su historial de entregas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filtrar proveedores por tipo de entrega">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTimingFilter(option.key)}
                aria-pressed={timingFilter === option.key}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  timingFilter === option.key
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {option.label}
                <span className="font-mono text-[10px] tabular-nums opacity-80">{option.count}</span>
              </button>
            ))}
          </div>
        </header>
        {delivery.isLoading ? (
          <TableSkeleton columns={9} />
        ) : delivery.isError ? (
          <PanelError onRetry={() => delivery.refetch()} />
        ) : !deliveryRows.length ? (
          <div className="min-h-[160px]">
            <EmptyState
              icon={<Truck size={28} className="text-text-secondary" aria-hidden="true" />}
              message="Sin órdenes recibidas en el período."
            />
          </div>
        ) : !sortedRows.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-6">
            <p className="text-sm text-text-secondary">No hay proveedores con ese tipo de entrega en el período.</p>
            <button
              type="button"
              onClick={() => setTimingFilter('all')}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-secondary">
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <SortHeader label="Órdenes" sortKey="orders" sort={sort} onSort={toggleSort} />
                  <th className="px-4 py-2.5 text-right font-medium">Anticipadas</th>
                  <th className="px-4 py-2.5 text-right font-medium">A tiempo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Con demora</th>
                  <SortHeader label="Cumplimiento" sortKey="compliance" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Desvío" sortKey="delay" sort={sort} onSort={toggleSort} />
                  <th className="px-4 py-2.5 text-right font-medium">Pendientes</th>
                  <SortHeader label="Gasto" sortKey="spend" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Última entrega" sortKey="last" sort={sort} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const classified = row.early + row.onTime + row.late;
                  const compliance = complianceRate(row);
                  return (
                    <tr key={row.vendorId} className="border-b border-border/60 last:border-0 hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedVendor(row)}
                          className="group flex w-full items-center gap-2 text-left"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-text-primary group-hover:text-accent">{row.vendorName}</span>
                            <span className="mt-1 flex h-1.5 w-28 overflow-hidden rounded-full bg-surface-hover" aria-hidden="true">
                              <span className="bg-info" style={{ width: `${classified ? (row.early / classified) * 100 : 0}%` }} />
                              <span className="bg-success" style={{ width: `${classified ? (row.onTime / classified) * 100 : 0}%` }} />
                              <span className="bg-error" style={{ width: `${classified ? (row.late / classified) * 100 : 0}%` }} />
                            </span>
                          </span>
                          <ChevronRight
                            className="ml-auto h-4 w-4 shrink-0 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-text-secondary">{row.orders}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-info">{row.early}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums text-success">{row.onTime}</td>
                      <td className={`px-4 py-3 text-right font-mono text-[12px] tabular-nums ${row.late ? 'text-error' : 'text-text-secondary'}`}>
                        {row.late}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center justify-end gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover" aria-hidden="true">
                            <span
                              className={`block h-full ${compliance != null && compliance >= 0.8 ? 'bg-success' : 'bg-error'}`}
                              style={{ width: `${compliance != null ? compliance * 100 : 0}%` }}
                            />
                          </span>
                          <span className="font-mono text-[12px] tabular-nums text-text-secondary">
                            {compliance != null ? `${Math.round(compliance * 100)}%` : '—'}
                          </span>
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-[12px] font-medium tabular-nums ${
                          row.avgDelayDays != null && row.avgDelayDays > 0 ? 'text-error' : 'text-success'
                        }`}
                      >
                        {formatDelay(row.avgDelayDays)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] tabular-nums">
                        <span className={row.overdueOrders ? 'text-error' : 'text-text-secondary'}>{row.pendingOrders}</span>
                        {row.overdueOrders > 0 && <span className="ml-1 text-[10px] text-error">({row.overdueOrders} atras.)</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] font-medium tabular-nums text-text-primary">
                        {formatMoney(row.totalSpend)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.lastReceivedAt ? (
                          <span className="inline-flex flex-col items-end gap-0.5">
                            <span className="text-xs text-text-secondary">{formatShortDate(row.lastReceivedAt)}</span>
                            {row.lastTiming && <TimingBadge timing={row.lastTiming} />}
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Entregas pendientes</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Órdenes abiertas con fecha esperada. Las atrasadas aparecen primero.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {overdueOrders > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {numberFmt.format(overdueOrders)} atrasadas
              </span>
            )}
            <span className="text-xs text-text-secondary">{numberFmt.format(pendingOrders)} pendientes</span>
            <button
              type="button"
              onClick={() => setPendingOnlyOverdue((value) => !value)}
              aria-pressed={pendingOnlyOverdue}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                pendingOnlyOverdue
                  ? 'bg-error/10 text-error'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              Solo atrasadas
            </button>
          </div>
        </header>
        {pending.isLoading ? (
          <TableSkeleton columns={5} />
        ) : pending.isError ? (
          <PanelError onRetry={() => pending.refetch()} />
        ) : !pendingRows.length ? (
          <div className="min-h-[160px]">
            <EmptyState
              icon={<PackageCheck size={28} className="text-text-secondary" aria-hidden="true" />}
              message="No hay entregas pendientes en el período."
            />
          </div>
        ) : !pendingFiltered.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-6">
            <p className="text-sm text-text-secondary">No hay entregas atrasadas en el período.</p>
            <button
              type="button"
              onClick={() => setPendingOnlyOverdue(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
            >
              Ver todas
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-secondary">
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <th className="px-4 py-2.5 font-medium">Orden</th>
                  <th className="px-4 py-2.5 text-right font-medium">Fecha esperada</th>
                  <th className="px-4 py-2.5 text-right font-medium">Situación</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiltered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-2.5 text-text-primary">{row.vendorName}</td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/purchasing/${row.id}`)}
                        className="font-mono text-[12px] text-accent hover:underline"
                      >
                        {row.documentId}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular-nums text-text-secondary">
                      {formatDate(row.expectedDate)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <PendingBadge days={row.daysUntilDue} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] font-medium tabular-nums text-text-primary">
                      {formatMoney(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Gasto por categoría de proveedor</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Compras acumuladas por categoría en el período.</p>
          </div>
          {spendReady && (
            <span className="text-xs text-text-secondary">
              {spendRows.length} {spendRows.length === 1 ? 'categoría' : 'categorías'}
            </span>
          )}
        </header>
        {spend.isLoading ? (
          <TableSkeleton columns={3} />
        ) : spend.isError ? (
          <PanelError onRetry={() => spend.refetch()} />
        ) : !spendRows.length ? (
          <div className="min-h-[160px]">
            <EmptyState
              icon={<Tags size={28} className="text-text-secondary" aria-hidden="true" />}
              message="Sin compras en el período."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-secondary">
                  <th className="px-4 py-2.5 font-medium">Categoría</th>
                  <th className="px-4 py-2.5 text-right font-medium">Órdenes</th>
                  <th className="px-4 py-2.5 text-right font-medium">Gasto total</th>
                </tr>
              </thead>
              <tbody>
                {spendRows.map((row) => (
                  <tr key={row.categoryId ?? 'uncategorized'} className="border-b border-border/60 last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-2.5 text-text-primary">{row.categoryName}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular-nums text-text-secondary">{row.orders}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[12px] font-medium tabular-nums text-text-primary">{formatMoney(row.totalSpend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer.Root isOpen={Boolean(selectedVendor)} onOpenChange={(open) => { if (!open) setSelectedVendor(null); }}>
        <Drawer.Backdrop isDismissable>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="flex h-full w-full max-w-full flex-col bg-overlay p-0 sm:w-[640px]">
              <Drawer.Header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <Drawer.Heading className="font-brand text-base font-extrabold text-text-primary">
                    {selectedVendor?.vendorName ?? ''}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-xs text-text-secondary">Historial de entregas</p>
                </div>
                <Drawer.CloseTrigger
                  aria-label="Cerrar"
                  className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  ✕
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {selectedVendor && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <DetailStat label="Órdenes recibidas" value={numberFmt.format(selectedVendor.orders)} />
                      <DetailStat
                        label="Cumplimiento"
                        value={
                          complianceRate(selectedVendor) != null
                            ? `${Math.round(complianceRate(selectedVendor)! * 100)}%`
                            : '—'
                        }
                        tone={
                          complianceRate(selectedVendor) == null
                            ? undefined
                            : complianceRate(selectedVendor)! >= 0.8
                              ? 'success'
                              : 'error'
                        }
                      />
                      <DetailStat label="Anticipadas" value={numberFmt.format(selectedVendor.early)} tone="info" />
                      <DetailStat label="A tiempo" value={numberFmt.format(selectedVendor.onTime)} tone="success" />
                      <DetailStat
                        label="Con demora"
                        value={numberFmt.format(selectedVendor.late)}
                        tone={selectedVendor.late ? 'error' : undefined}
                      />
                      <DetailStat
                        label="Desvío promedio"
                        value={formatDelay(selectedVendor.avgDelayDays)}
                        tone={selectedVendor.avgDelayDays != null && selectedVendor.avgDelayDays > 0 ? 'error' : 'success'}
                      />
                      <DetailStat
                        label="Anticipación prom."
                        value={selectedVendor.avgEarlyDays != null ? `${selectedVendor.avgEarlyDays} d` : '—'}
                        tone="info"
                      />
                      <DetailStat
                        label="Demora prom."
                        value={selectedVendor.avgLateDays != null ? `${selectedVendor.avgLateDays} d` : '—'}
                        tone={selectedVendor.avgLateDays != null ? 'error' : undefined}
                      />
                      <DetailStat label="Pendientes" value={numberFmt.format(selectedVendor.pendingOrders)} />
                      <DetailStat
                        label="Atrasadas"
                        value={numberFmt.format(selectedVendor.overdueOrders)}
                        tone={selectedVendor.overdueOrders ? 'error' : undefined}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">Historial reciente</h3>
                          <p className="mt-0.5 text-xs text-text-secondary">Últimas órdenes del proveedor en el período.</p>
                        </div>
                        {!history.isLoading && !history.isError && (
                          <span className="text-xs text-text-secondary">
                            {historyRows.length} {historyRows.length === 1 ? 'orden' : 'órdenes'}
                          </span>
                        )}
                      </div>
                      {history.isLoading ? (
                        <TableSkeleton columns={6} />
                      ) : history.isError ? (
                        <PanelError onRetry={() => history.refetch()} />
                      ) : !historyRows.length ? (
                        <p className="mt-4 text-sm text-text-secondary">Sin órdenes en el período.</p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full min-w-[560px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-border text-xs text-text-secondary">
                                <th className="px-3 py-2 font-medium">Orden</th>
                                <th className="px-3 py-2 text-right font-medium">Esperada</th>
                                <th className="px-3 py-2 text-right font-medium">Recibida</th>
                                <th className="px-3 py-2 text-right font-medium">Clasificación</th>
                                <th className="px-3 py-2 text-right font-medium">Desvío</th>
                                <th className="px-3 py-2 text-right font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyRows.map((order) => (
                                <tr key={order.id} className="border-b border-border/60 last:border-0">
                                  <td className="px-3 py-2 font-mono text-[11px] text-text-primary">{order.documentId}</td>
                                  <td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-text-secondary">
                                    {formatShortDate(order.expectedDate)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-text-secondary">
                                    {formatShortDate(order.receivedAt)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {order.receivedAt ? (
                                      <TimingBadge timing={order.timing} />
                                    ) : (
                                      <span className="inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                                        Pendiente
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-text-secondary">
                                    {formatDelay(order.delayDays)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-[11px] font-medium tabular-nums text-text-primary">
                                    {formatMoney(order.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Drawer.Body>
              <Drawer.Footer className="shrink-0 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedVendor(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
                >
                  Cerrar
                </button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </div>
  );
}

function Stat({ label, value, hint, tone }: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'error' | 'success';
}) {
  const toneClass = tone === 'error' ? 'text-error' : tone === 'success' ? 'text-success' : 'text-text-primary';
  return (
    <div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-1 break-words font-mono text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-text-secondary">{hint}</p>}
    </div>
  );
}

function DetailStat({ label, value, tone }: {
  label: string;
  value: string;
  tone?: 'error' | 'success' | 'info';
}) {
  const toneClass =
    tone === 'error' ? 'text-error' : tone === 'success' ? 'text-success' : tone === 'info' ? 'text-info' : 'text-text-primary';
  return (
    <div className="rounded-lg border border-border bg-canvas px-3 py-2">
      <p className="text-[11px] text-text-secondary">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function Legend({ color, label, count, total }: {
  color: string;
  label: string;
  count: number;
  total: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      <span>{label}</span>
      <span className="font-mono text-[11px] tabular-nums text-text-primary">{count}</span>
      <span className="text-[11px] text-text-secondary">{pct(count, total)}</span>
    </span>
  );
}

function TimingBadge({ timing }: { timing: DeliveryTiming }) {
  const config = {
    EARLY: { label: 'Anticipada', className: 'bg-info/10 text-info' },
    ON_TIME: { label: 'A tiempo', className: 'bg-success/10 text-success' },
    LATE: { label: 'Con demora', className: 'bg-error/10 text-error' },
    UNKNOWN: { label: 'Sin referencia', className: 'bg-surface-hover text-text-secondary' },
  }[timing];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

function PendingBadge({ days }: { days: number | null }) {
  if (days == null) {
    return <span className="text-xs text-text-secondary">Sin fecha</span>;
  }
  if (days < 0) {
    return (
      <span className="inline-flex rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-semibold text-error">
        {Math.abs(days)} d de atraso
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
        Vence hoy
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">
      En {days} d
    </span>
  );
}

function SortHeader({ label, sortKey, sort, onSort }: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      className="px-4 py-2.5 text-right font-medium"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex flex-row-reverse items-center gap-1 hover:text-text-primary"
      >
        {label}
        {active ? (
          sort.dir === 'asc' ? (
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
        )}
      </button>
    </th>
  );
}

function TableSkeleton({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return (
    <div className="p-4" role="status" aria-label="Cargando métricas">
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-3 animate-pulse rounded bg-surface-hover" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-6">
      <p className="text-sm text-text-secondary">No se pudieron cargar las métricas.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
      >
        Reintentar
      </button>
    </div>
  );
}
