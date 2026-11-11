import { Module } from '@nestjs/common';
import { DocumentModule } from '@/modules/document-engine/infrastructure/document.module';
import { MetricsModule } from '@/common/metrics/metrics.module';
import { AuditModule } from '@/common/audit/audit.module';
import { PosController } from './infrastructure/pos.controller';
import { PosSaleController } from './infrastructure/pos-sale.controller';
import { PrismaPosRepository } from './infrastructure/prisma-pos.repository';
import { PrismaSalesRepository } from '@/modules/sales/infrastructure/prisma-sales.repository';
import { PosSessionService } from './application/pos-session.service';
import { QuickSaleService } from './application/quick-sale.service';
import { PosSaleService } from './application/pos-sale.service';

@Module({
  imports: [DocumentModule, MetricsModule, AuditModule],
  controllers: [PosController, PosSaleController],
  providers: [
    PosSessionService,
    QuickSaleService,
    PosSaleService,
    { provide: 'PosRepository', useClass: PrismaPosRepository },
    { provide: 'SalesRepository', useClass: PrismaSalesRepository },
  ],
  exports: ['PosRepository', 'SalesRepository'],
})
export class PosModule {}
