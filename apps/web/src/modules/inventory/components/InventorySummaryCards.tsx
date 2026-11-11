import type { ReactNode } from 'react';
import { BarChart3, HeartPulse, Timer, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useInventorySummary } from '../hooks/useInventorySummary';

export function InventorySummaryCards() {
  const { t, locale } = useTranslation();
  const { data, isPending, isError, refetch } = useInventorySummary();

  if (isPending) {
    return (
      <div role="status" className="mb-4 grid gap-4 md:grid-cols-3">
        <span className="sr-only">{t('inventory.summary.loading')}</span>
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div role="alert" className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-text-secondary">{t('inventory.summary.error')}</p>
        <button
          onClick={() => refetch()}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover"
        >
          {t('inventory.summary.retry')}
        </button>
      </div>
    );
  }

  const numberFmt = new Intl.NumberFormat(locale, { useGrouping: true });
  const formatMoney = (value: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: data.valuation.currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${numberFmt.format(value)} ${data.valuation.currency}`;
    }
  };

  const healthSegments = [
    { key: 'healthy', label: t('inventory.summary.healthy'), count: data.stockHealth.healthy, color: 'bg-success' },
    { key: 'low', label: t('inventory.summary.low'), count: data.stockHealth.low, color: 'bg-warning' },
    { key: 'out', label: t('inventory.summary.out'), count: data.stockHealth.out, color: 'bg-error' },
    { key: 'overstock', label: t('inventory.summary.overstock'), count: data.stockHealth.overstock, color: 'bg-accent' },
  ];
  const healthBarLabel = healthSegments
    .map((s) => `${s.label}: ${data.totalProducts > 0 ? Math.round((s.count / data.totalProducts) * 100) : 0}%`)
    .join(' · ');
  const healthyPercentage = data.totalProducts > 0
    ? Math.round((data.stockHealth.healthy / data.totalProducts) * 100)
    : 0;

  const categories = [...data.valuation.categories].sort((a, b) => b.value - a.value);
  const maxCategoryValue = Math.max(...categories.map((c) => c.value), 0);

  const coverageBuckets = [
    { key: 'under7', label: t('inventory.summary.under7'), count: data.coverage.under7 },
    { key: 'from7to30', label: t('inventory.summary.from7to30'), count: data.coverage.from7to30 },
    { key: 'over30', label: t('inventory.summary.over30'), count: data.coverage.over30 },
    { key: 'noSales', label: t('inventory.summary.noSales'), count: data.coverage.noSales },
  ];

  return (
    <div className="mb-4 grid gap-4 md:grid-cols-3">
      <SummaryCard title={t('inventory.summary.healthTitle')} subtitle={t('inventory.summary.healthSubtitle')} icon={HeartPulse}>
        {data.totalProducts === 0 ? (
          <EmptyState text={t('inventory.summary.emptyProducts')} />
        ) : (
          <>
            <p className="mb-3 text-lg font-bold tracking-tight text-text-primary">
              {t('inventory.summary.healthyPercentage')
                .replace('{percent}', String(healthyPercentage))
                .replace('{healthy}', t('inventory.summary.healthy'))}
            </p>
            <div role="img" aria-label={healthBarLabel} className="flex h-2.5 w-full gap-0.5">
              {healthSegments.map((s) => (
                <div
                  key={s.key}
                  className={`${s.color} rounded-full`}
                  style={{ width: `${(s.count / data.totalProducts) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
              {healthSegments.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${s.color}`} />
                    <span className="text-sm font-semibold tabular-nums text-text-primary">{numberFmt.format(s.count)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </SummaryCard>

      <SummaryCard title={t('inventory.summary.valueTitle')} subtitle={t('inventory.summary.valueSubtitle')} icon={BarChart3}>
        <p className="text-2xl font-bold tabular-nums text-text-primary">{formatMoney(data.valuation.totalValue)}</p>
        {categories.length === 0 ? (
          <EmptyState text={t('inventory.summary.emptyValuation')} />
        ) : (
          <ul className="mt-3 space-y-2.5">
            {categories.map((c) => {
              const name = c.name ?? t('inventory.summary.uncategorized');
              const pct = maxCategoryValue > 0 ? (c.value / maxCategoryValue) * 100 : 0;
              return (
                <li key={c.categoryId ?? 'uncategorized'}>
                  <div className="grid grid-cols-[minmax(5rem,auto)_minmax(4rem,1fr)_auto] items-center gap-2 text-xs">
                    <span className="truncate text-text-secondary">{name}</span>
                    <div
                      role="img"
                      aria-label={`${name}: ${Math.round(pct)}%`}
                      className="h-1.5 w-full rounded-full bg-surface-hover"
                    >
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-text-primary">{formatMoney(c.value)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SummaryCard>

      <SummaryCard title={t('inventory.summary.coverTitle')} subtitle={t('inventory.summary.coverSubtitle')} icon={Timer}>
        {data.coverage.medianDays === null ? (
          <EmptyState text={t('inventory.summary.emptyCoverage')} />
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums text-text-primary">
              {numberFmt.format(data.coverage.medianDays)}{' '}
              <span className="text-sm font-normal text-text-secondary">{t('inventory.summary.days')}</span>
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {t('inventory.summary.medianCaption').replace('{days}', String(data.coverage.periodDays))}
            </p>
            <div className="mt-4 space-y-2.5">
              {coverageBuckets.map((b) => {
                const maxCoverage = Math.max(...coverageBuckets.map((bucket) => bucket.count), 0);
                const pct = maxCoverage > 0 ? (b.count / maxCoverage) * 100 : 0;
                return (
                <div key={b.key} className="grid grid-cols-[minmax(5rem,auto)_minmax(4rem,1fr)_auto] items-center gap-2">
                  <span className="text-xs text-text-secondary">{b.label}</span>
                  <div
                    role="img"
                    aria-label={`${b.label}: ${numberFmt.format(b.count)}`}
                    className="h-2 w-full rounded-full bg-surface-hover"
                  >
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-text-primary">{numberFmt.format(b.count)}</span>
                </div>
                );
              })}
            </div>
          </>
        )}
      </SummaryCard>
    </div>
  );
}

function SummaryCard({ title, subtitle, icon: Icon, children }: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} aria-hidden="true" className="shrink-0 text-text-secondary" />
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-text-secondary">{text}</p>;
}
