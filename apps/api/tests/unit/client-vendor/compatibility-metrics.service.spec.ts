import { CompatibilityMetricsService } from '../../../src/modules/client-vendor/infrastructure/compatibility-metrics.service';

describe('CompatibilityMetricsService', () => {
  let metrics: CompatibilityMetricsService;

  beforeEach(() => { metrics = new CompatibilityMetricsService(); });

  it('should start at zero', () => {
    const s = metrics.snapshot();
    expect(s.clients.reads).toBe(0);
    expect(s.total).toBe(0);
  });

  it('should track client reads', () => {
    metrics.trackClientRead();
    metrics.trackClientRead();
    expect(metrics.snapshot().clients.reads).toBe(2);
  });

  it('should track client writes', () => {
    metrics.trackClientWrite();
    expect(metrics.snapshot().clients.writes).toBe(1);
  });

  it('should track client deletes', () => {
    metrics.trackClientDelete();
    expect(metrics.snapshot().clients.deletes).toBe(1);
  });

  it('should track vendor reads', () => {
    metrics.trackVendorRead();
    expect(metrics.snapshot().vendors.reads).toBe(1);
  });

  it('should track vendor writes', () => {
    metrics.trackVendorWrite();
    expect(metrics.snapshot().vendors.writes).toBe(1);
  });

  it('should track vendor deletes', () => {
    metrics.trackVendorDelete();
    expect(metrics.snapshot().vendors.deletes).toBe(1);
  });

  it('should track partner reads', () => {
    metrics.trackPartnerRead();
    expect(metrics.snapshot().partners.reads).toBe(1);
  });

  it('should track partner writes', () => {
    metrics.trackPartnerWrite();
    expect(metrics.snapshot().partners.writes).toBe(1);
  });

  it('should compute total across all counters', () => {
    metrics.trackClientRead();
    metrics.trackClientWrite();
    metrics.trackVendorRead();
    expect(metrics.snapshot().total).toBe(3);
  });

  it('should reset', () => {
    metrics.trackClientRead();
    metrics.trackClientWrite();
    metrics.reset();
    expect(metrics.snapshot().total).toBe(0);
  });
});
