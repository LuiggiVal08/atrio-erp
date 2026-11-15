import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { AnimatedBar } from '@/core/components/AnimatedBar';
import { AnimatedNumber } from '@/core/components/AnimatedNumber';
import { Skeleton } from '@/core/components/Skeleton';
import type { WarehouseSummary } from '../hooks/useWarehouses';

const HEALTH_SEGMENTS = [
  { key: 'healthy', color: 'var(--status-success)' },
  { key: 'low', color: 'var(--status-warning)' },
  { key: 'out', color: 'var(--status-error)' },
  { key: 'overstock', color: 'var(--accent-main)' },
] as const;

const CATEGORY_COLORS = [
  'var(--accent-main)',
  'var(--status-info)',
  'var(--status-success)',
  'var(--status-warning)',
  'var(--status-error)',
  '#8B7CF6',
  '#F472B6',
  '#34D399',
];

function money(value: number, locale: string): string {
  return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function quantity(value: number, locale: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 20 });
}

export function WarehouseStockTab({
  summary,
  isLoading,
  isError = false,
  isFetching = false,
  onRetry,
}: {
  summary?: WarehouseSummary;
  isLoading: boolean;
  isError?: boolean;
  isFetching?: boolean;
  onRetry?: () => void;
}) {
  const { t, locale } = useTranslation();

  const readError = (
    <div role="alert" className="text-sm text-error">
      {locale === 'en' ? 'Could not load the inventory summary.' : 'No se pudo cargar el resumen del inventario.'}
      {onRetry && <button type="button" onClick={onRetry} disabled={isFetching} className="ml-3 font-semibold text-accent disabled:opacity-50">{isFetching ? t('common.loading') : t('common.retry')}</button>}
    </div>
  );

  if (isError && !summary) return readError;
  if (isLoading) {
    return (
      <div role="status" aria-busy="true" className="grid gap-3">
        <span className="sr-only">{t('common.loading')}</span>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rect" height={74} />
          ))}
        </div>
        <Skeleton variant="rect" height={220} />
      </div>
    );
  }

  if (!summary) return readError;

  const healthTotal =
    summary.health.healthy + summary.health.low + summary.health.out + summary.health.overstock;
  const categories = summary.categories.filter((category) => category.value > 0 || category.units > 0);

  return (
    <div className="grid gap-4">
      {isError && readError}
      {isFetching && <p role="status" className="text-xs text-text-secondary">{t('common.loading')}</p>}
      <p className="text-xs text-text-secondary">
        {locale === 'en'
          ? 'Stock is recorded per warehouse, not per bin. Quantities mix product units without conversion; their sum is not a comparable physical quantity.'
          : 'El stock se registra por almacén, no por bin. Las cantidades mezclan unidades de productos sin conversión; su suma no representa una cantidad física comparable.'}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('inventory.warehouseView.skuCount')} value={summary.skuCount} />
        <StatCard label={locale === 'en' ? 'Sum without unit conversion' : 'Suma sin conversión de unidades'} value={summary.totalUnits} format={(value) => quantity(value, locale)} />
        <StatCard
          label={t('inventory.warehouseView.totalValue')}
          value={summary.totalValue}
          format={(value) => `${summary.currency} ${money(value, locale)}`}
        />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {t('inventory.warehouseView.healthTitle')}
          </h3>
          <span className="font-mono text-xs tabular-nums text-text-secondary">{quantity(healthTotal, locale)} SKU</span>
        </div>
        {healthTotal === 0 ? (
          <p className="text-sm text-text-secondary">{t('inventory.warehouseView.noStock')}</p>
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-hover">
              {HEALTH_SEGMENTS.map((segment) => {
                const count = summary.health[segment.key];
                if (count === 0) return null;
                return (
                  <AnimatedBar
                    key={segment.key}
                    value={(count / healthTotal) * 100}
                    className="h-full flex-none"
                    style={{ backgroundColor: segment.color }}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {HEALTH_SEGMENTS.map((segment) => (
                <span key={segment.key} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                    aria-hidden="true"
                  />
                  {t(`inventory.warehouseView.health${segment.key[0].toUpperCase()}${segment.key.slice(1)}`)}
                  <span className="font-mono font-semibold text-text-primary">
                    {summary.health[segment.key]}
                  </span>
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          {t('inventory.warehouseView.categoriesTitle')}
        </h3>
        {categories.length === 0 ? (
          <p className="text-sm text-text-secondary">{t('inventory.warehouseView.noCategories')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,240px)_1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive
                    animationDuration={600}
                  >
                    {categories.map((category, index) => (
                      <Cell
                        key={category.categoryId ?? 'none'}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-thin)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${summary.currency} ${money(Number(value), locale)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-secondary">
                    <th className="px-2 py-2 text-left">{t('inventory.warehouseView.category')}</th>
                    <th className="px-2 py-2 text-right">{locale === 'en' ? 'Mixed quantities' : 'Cantidades mixtas'}</th>
                    <th className="px-2 py-2 text-right">{t('inventory.warehouseView.value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={category.categoryId ?? 'none'} className="border-b border-border/60">
                      <td className="px-2 py-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                            aria-hidden="true"
                          />
                          {category.name ?? t('inventory.warehouseView.noCategory')}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-text-secondary">
                        {quantity(category.units, locale)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-text-primary">
                        {money(category.value, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-text-primary">
        <AnimatedNumber value={value} format={format} enabled={false} />
      </div>
    </div>
  );
}
