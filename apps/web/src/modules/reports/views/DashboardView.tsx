import { useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  PieChart,
  CalendarDays,
} from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuthStore } from '@/core/auth/store';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { CardSkeleton } from '@/core/components/CardSkeleton';
import { DeferredMount } from '@/core/components/DeferredMount';
import { useDashboardSummary } from '../hooks/useDashboard';
import { KpiCard } from '../components/KpiCard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { TopProductsChart } from '../components/TopProductsChart';
import { LowStockTable } from '../components/LowStockTable';
import { WeekCalendarWidget } from '../components/WeekCalendarWidget';
import { SortableDashboardSection } from '../components/SortableDashboardSection';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  useReportsStore,
  type DashboardSection,
} from '../store/reports-store';

const sectionLabelKeys: Record<DashboardSection, string> = {
  kpis: 'reports.dashboard.kpis',
  calendar: 'reports.dashboard.calendar',
  trend: 'reports.dashboard.trend',
  products: 'reports.dashboard.topProducts',
  stock: 'reports.dashboard.lowStock',
};

function greetingKey(hour: number): string {
  if (hour < 12) return 'reports.dashboard.greeting.morning';
  if (hour < 18) return 'reports.dashboard.greeting.afternoon';
  return 'reports.dashboard.greeting.evening';
}

const sectionIcons: Record<DashboardSection, React.ReactNode> = {
  kpis: <BarChart3 size={14} />,
  calendar: <CalendarDays size={14} />,
  trend: <TrendingUp size={14} />,
  products: <PieChart size={14} />,
  stock: <Package size={14} />,
};

export function DashboardView() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { t } = useTranslation();
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? 'anonymous');
  const userId = useAuthStore((state) => state.user?.id ?? 'anonymous');
  const userName = useAuthStore((state) => state.user?.name ?? '');
  const scopeKey = `${tenantId}:${userId}`;
  const sectionLabel = (section: DashboardSection) => t(sectionLabelKeys[section]);

  const layout = useReportsStore(
    (state) => state.dashboardLayouts[scopeKey] ?? DEFAULT_DASHBOARD_LAYOUT,
  );
  const reorderDashboardSection = useReportsStore((state) => state.reorderDashboardSection);
  const toggleDashboardSection = useReportsStore((state) => state.toggleDashboardSection);

  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const widgetMenuRef = useRef<HTMLDivElement>(null);
  const widgetButtonRef = useRef<HTMLButtonElement>(null);
  const firstWidgetCheckboxRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function toggleSection(section: DashboardSection) {
    toggleDashboardSection(scopeKey, section);
  }

  function moveSection(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= layout.length) return;
    reorderDashboardSection(scopeKey, index, target);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = layout.indexOf(active.id as DashboardSection);
    const to = layout.indexOf(over.id as DashboardSection);
    if (from !== -1 && to !== -1) reorderDashboardSection(scopeKey, from, to);
  }

  function closeWidgetMenu() {
    setShowWidgetMenu(false);
    widgetButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!showWidgetMenu) return;

    firstWidgetCheckboxRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const clickedOutsideMenu = !widgetMenuRef.current?.contains(target);
      const clickedWidgetButton = widgetButtonRef.current?.contains(target);
      if (clickedOutsideMenu && !clickedWidgetButton) setShowWidgetMenu(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWidgetMenu();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showWidgetMenu]);

  function renderSection(section: DashboardSection) {
    switch (section) {
      case 'kpis':
        return summaryLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} lines={2} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard
              title={t('reports.dashboard.todaySales')}
              value={summary?.todaySales ?? 0}
              icon={DollarSign}
              color="accent"
            />
            <KpiCard
              title={t('reports.dashboard.monthSales')}
              value={summary?.monthSales ?? 0}
              change={summary?.salesChange}
              icon={TrendingUp}
              color="success"
            />
            <KpiCard
              title={t('reports.dashboard.activeClients')}
              value={summary?.activeClients ?? 0}
              icon={Users}
              color="accent"
            />
            <KpiCard
              title={t('reports.dashboard.lowStockCount')}
              value={summary?.lowStockProducts ?? 0}
              icon={Package}
              color="warning"
            />
          </div>
        );

      case 'calendar':
        return (
          <DeferredMount placeholder={<div className="h-72" />}>
            <div className="max-w-md rounded-2xl border border-white/10 bg-surface p-4">
              <WeekCalendarWidget />
            </div>
          </DeferredMount>
        );

      case 'trend':
        return (
          <DeferredMount placeholder={<div className="h-64" />}>
            <div className="rounded-2xl border border-white/10 bg-surface p-4">
              <SalesTrendChart />
            </div>
          </DeferredMount>
        );

      case 'products':
        return (
          <DeferredMount placeholder={<div className="h-64" />}>
            <div className="rounded-2xl border border-white/10 bg-surface p-4">
              <TopProductsChart />
            </div>
          </DeferredMount>
        );

      case 'stock':
        return (
          <DeferredMount placeholder={<div className="h-64" />}>
            <div className="rounded-2xl border border-white/10 bg-surface p-4">
              <LowStockTable />
            </div>
          </DeferredMount>
        );
    }
  }
  const greeting = `${t(greetingKey(new Date().getHours()))}, ${userName || t('reports.dashboard.userFallback')}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div>
          <h1 className="text-xl font-light text-text-primary">{greeting}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">{t('reports.dashboard.subtitle')}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <DateRangeFilter />
          <div className="relative">
            <button
              ref={widgetButtonRef}
              onClick={() => setShowWidgetMenu(!showWidgetMenu)}
              aria-expanded={showWidgetMenu}
              aria-controls="dashboard-widget-menu"
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:min-h-9"
            >
              + Widgets
            </button>
            {showWidgetMenu && (
              <div
                ref={widgetMenuRef}
                id="dashboard-widget-menu"
                role="menu"
                aria-label={t('reports.dashboard.widgetMenuLabel')}
                className="absolute right-0 top-full z-20 mt-1 w-[min(14rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-2 shadow-lg"
              >
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {t('reports.dashboard.widgetMenuHeading')}
                </p>
                {(Object.keys(sectionLabelKeys) as DashboardSection[]).map((section, index) => (
                  <label
                    key={section}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-text-primary hover:bg-surface-hover"
                  >
                    <input
                      ref={index === 0 ? firstWidgetCheckboxRef : undefined}
                      type="checkbox"
                      role="menuitemcheckbox"
                      aria-label={sectionLabel(section)}
                      checked={layout.includes(section)}
                      onChange={() => toggleSection(section)}
                      className="size-4 rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <span className="flex items-center gap-1.5">
                      {sectionIcons[section]}
                      {sectionLabel(section)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-6 overflow-auto py-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout} strategy={verticalListSortingStrategy}>
            {layout.map((section, index) => (
              <SortableDashboardSection
                key={section}
                id={section}
                title={sectionLabel(section)}
                icon={sectionIcons[section]}
                canMoveUp={index > 0}
                canMoveDown={index < layout.length - 1}
                onMoveUp={() => moveSection(index, -1)}
                onMoveDown={() => moveSection(index, 1)}
              >
                {renderSection(section)}
              </SortableDashboardSection>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
