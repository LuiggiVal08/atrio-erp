import { Injectable } from '@nestjs/common';
import type { CompatibilityMetricsRepository, CompatibilityMetricsSnapshot } from './compatibility-metrics.repository.interface';

@Injectable()
export class CompatibilityMetricsService implements CompatibilityMetricsRepository {
  private counters = {
    clientReads: 0,
    clientWrites: 0,
    clientDeletes: 0,
    vendorReads: 0,
    vendorWrites: 0,
    vendorDeletes: 0,
    partnerReads: 0,
    partnerWrites: 0,
  };

  trackClientRead() { this.counters.clientReads++; }
  trackClientWrite() { this.counters.clientWrites++; }
  trackClientDelete() { this.counters.clientDeletes++; }
  trackVendorRead() { this.counters.vendorReads++; }
  trackVendorWrite() { this.counters.vendorWrites++; }
  trackVendorDelete() { this.counters.vendorDeletes++; }
  trackPartnerRead() { this.counters.partnerReads++; }
  trackPartnerWrite() { this.counters.partnerWrites++; }

  snapshot(): CompatibilityMetricsSnapshot {
    const { clientReads, clientWrites, clientDeletes, vendorReads, vendorWrites, vendorDeletes, partnerReads, partnerWrites } = this.counters;
    return {
      clients: { reads: clientReads, writes: clientWrites, deletes: clientDeletes },
      vendors: { reads: vendorReads, writes: vendorWrites, deletes: vendorDeletes },
      partners: { reads: partnerReads, writes: partnerWrites },
      total: clientReads + clientWrites + clientDeletes + vendorReads + vendorWrites + vendorDeletes + partnerReads + partnerWrites,
    };
  }

  reset() {
    this.counters = {
      clientReads: 0, clientWrites: 0, clientDeletes: 0,
      vendorReads: 0, vendorWrites: 0, vendorDeletes: 0,
      partnerReads: 0, partnerWrites: 0,
    };
  }
}
