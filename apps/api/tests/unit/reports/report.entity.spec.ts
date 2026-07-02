import { Report, ReportType, ReportFormat } from '../../../src/modules/reports/domain/report.entity';

describe('Report Entity', () => {
  it('should create a Report instance', () => {
    const report = new Report(
      'id-1', 'tenant-1', ReportType.SALES, ReportFormat.PDF, null,
      [{ date: '2026-06-01', total: 100 }], new Date('2026-06-30'), null, null,
    );
    expect(report).toBeDefined();
    expect(report.id).toBe('id-1');
    expect(report.type).toBe(ReportType.SALES);
    expect(report.format).toBe(ReportFormat.PDF);
    expect(report.data).toHaveLength(1);
  });

  it('should accept all report types', () => {
    const types = [ReportType.SALES, ReportType.INVENTORY, ReportType.CASH, ReportType.CLIENTS, ReportType.TAXES, ReportType.PROFIT];
    const report = new Report('id', 't', types[0], ReportFormat.XLSX, {}, [], new Date(), null, null);
    expect(types).toContain(report.type);
  });
});
