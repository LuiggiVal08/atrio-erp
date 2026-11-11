import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  useReportsStore,
} from '@/modules/reports/store/reports-store';

const SCOPE_KEY = 'tenant-1:user-1';

describe('reports store — dashboard layout', () => {
  beforeEach(() => {
    useReportsStore.setState({ dashboardLayouts: {} });
    localStorage.clear();
  });

  it('returns the default layout when the scope has no saved layout', () => {
    expect(useReportsStore.getState().getDashboardLayout(SCOPE_KEY)).toEqual(
      DEFAULT_DASHBOARD_LAYOUT,
    );
  });

  it('reorders a section moving it forward', () => {
    useReportsStore.getState().setDashboardLayout(SCOPE_KEY, [...DEFAULT_DASHBOARD_LAYOUT]);

    useReportsStore.getState().reorderDashboardSection(SCOPE_KEY, 0, 2);

    expect(useReportsStore.getState().getDashboardLayout(SCOPE_KEY)).toEqual([
      'calendar',
      'trend',
      'kpis',
      'products',
      'stock',
    ]);
  });

  it('reorders a section moving it backward', () => {
    useReportsStore.getState().setDashboardLayout(SCOPE_KEY, [...DEFAULT_DASHBOARD_LAYOUT]);

    useReportsStore.getState().reorderDashboardSection(SCOPE_KEY, 3, 1);

    expect(useReportsStore.getState().getDashboardLayout(SCOPE_KEY)).toEqual([
      'kpis',
      'products',
      'calendar',
      'trend',
      'stock',
    ]);
  });

  it('ignores out-of-range reorders', () => {
    useReportsStore.getState().setDashboardLayout(SCOPE_KEY, [...DEFAULT_DASHBOARD_LAYOUT]);

    useReportsStore.getState().reorderDashboardSection(SCOPE_KEY, -1, 2);
    useReportsStore.getState().reorderDashboardSection(SCOPE_KEY, 0, 99);
    useReportsStore.getState().reorderDashboardSection(SCOPE_KEY, 2, 2);

    expect(useReportsStore.getState().getDashboardLayout(SCOPE_KEY)).toEqual(
      DEFAULT_DASHBOARD_LAYOUT,
    );
  });

  it('toggles a section off and back on at the end of the layout', () => {
    useReportsStore.getState().toggleDashboardSection(SCOPE_KEY, 'trend');

    expect(useReportsStore.getState().getDashboardLayout(SCOPE_KEY)).toEqual([
      'kpis',
      'calendar',
      'products',
      'stock',
    ]);

    useReportsStore.getState().toggleDashboardSection(SCOPE_KEY, 'trend');

    expect(useReportsStore.getState().getDashboardLayout(SCOPE_KEY)).toEqual([
      'kpis',
      'calendar',
      'products',
      'stock',
      'trend',
    ]);
  });

  it('keeps independent layouts per tenant/user scope', () => {
    useReportsStore.getState().reorderDashboardSection('tenant-1:user-1', 0, 1);
    useReportsStore.getState().reorderDashboardSection('tenant-2:user-9', 4, 0);

    expect(useReportsStore.getState().getDashboardLayout('tenant-1:user-1')).toEqual([
      'calendar',
      'kpis',
      'trend',
      'products',
      'stock',
    ]);
    expect(useReportsStore.getState().getDashboardLayout('tenant-2:user-9')).toEqual([
      'stock',
      'kpis',
      'calendar',
      'trend',
      'products',
    ]);
  });

  it('persists layouts under the atrio-reports key', () => {
    useReportsStore.getState().setDashboardLayout(SCOPE_KEY, ['stock', 'kpis']);

    const raw = localStorage.getItem('atrio-reports');
    expect(raw).not.toBeNull();
    expect(raw).toContain(SCOPE_KEY);
    expect(raw).toContain('stock');
  });
});
