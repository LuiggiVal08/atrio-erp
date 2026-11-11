export interface CompatibilityMetricsSnapshot {
  clients: { reads: number; writes: number; deletes: number };
  vendors: { reads: number; writes: number; deletes: number };
  partners: { reads: number; writes: number };
  total: number;
}

export const COMPATIBILITY_METRICS_REPOSITORY = 'COMPATIBILITY_METRICS_REPOSITORY';

export interface CompatibilityMetricsRepository {
  trackClientRead(): void;
  trackClientWrite(): void;
  trackClientDelete(): void;
  trackVendorRead(): void;
  trackVendorWrite(): void;
  trackVendorDelete(): void;
  trackPartnerRead(): void;
  trackPartnerWrite(): void;
  snapshot(): CompatibilityMetricsSnapshot;
  reset(): void;
}
