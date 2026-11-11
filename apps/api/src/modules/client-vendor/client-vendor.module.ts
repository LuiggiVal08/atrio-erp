import { Module } from '@nestjs/common';
import { BusinessPartnersModule } from '@/core/business-partners/infrastructure/business-partners.module';
import { ClientVendorController } from './infrastructure/client-vendor.controller';
import { PartnerCompatibilityAdapter } from './infrastructure/partner-compatibility.adapter';
import { PartnerToClientMapper } from './infrastructure/partner-to-client.mapper';
import { PartnerToVendorMapper } from './infrastructure/partner-to-vendor.mapper';
import { COMPATIBILITY_METRICS_REPOSITORY } from './infrastructure/compatibility-metrics.repository.interface';
import { CompatibilityMetricsService } from './infrastructure/compatibility-metrics.service';
import { LegacyApiInterceptor } from './infrastructure/legacy-api.interceptor';
import { ClientService } from './application/client.service';
import { VendorService } from './application/vendor.service';

@Module({
  imports: [BusinessPartnersModule],
  controllers: [ClientVendorController],
  providers: [
    ClientService,
    VendorService,
    PartnerToClientMapper,
    PartnerToVendorMapper,
    { provide: COMPATIBILITY_METRICS_REPOSITORY, useClass: CompatibilityMetricsService },
    LegacyApiInterceptor,
    { provide: 'ClientVendorRepository', useClass: PartnerCompatibilityAdapter },
  ],
  exports: ['ClientVendorRepository'],
})
export class ClientVendorModule {}
