import { DashboardWidget } from '../../../src/modules/reports/domain/dashboard-widget.entity';

describe('DashboardWidget Entity', () => {
  it('should create a DashboardWidget instance', () => {
    const widget = new DashboardWidget(
      'w-1', 't-1', 'u-1', 'kpi', { metric: 'today_sales' },
      0, 0, 2, 1, new Date(), new Date(),
    );
    expect(widget).toBeDefined();
    expect(widget.type).toBe('kpi');
    expect(widget.config.metric).toBe('today_sales');
    expect(widget.width).toBe(2);
    expect(widget.height).toBe(1);
  });
});
