import { Module } from '@nestjs/common';
import { DocumentModule } from '@/modules/document-engine/infrastructure/document.module';
import { PurchasingController } from './infrastructure/purchasing.controller';
import { PurchasingV2Controller } from './infrastructure/purchasing-v2.controller';
import { PriceListController } from './infrastructure/price-list.controller';
import { PrismaPurchasingRepository } from './infrastructure/prisma-purchasing.repository';
import { PrismaPurchasingV2Repository } from './infrastructure/prisma-purchasing-v2.repository';
import { PrismaPriceListRepository } from './infrastructure/prisma-price-list.repository';
import { PurchaseOrderService } from './application/purchase-order.service';
import { PurchaseReturnService } from './application/purchase-return.service';
import { PurchaseReceiveEventHandler } from './application/purchase-receive-event-handler';
import { PriceListService } from './application/price-list.service';
import { ManagePurchasingUseCase } from './application/manage-purchasing.use-case';
import { PurchasingMetricsService } from './application/purchasing-metrics.service';

@Module({
  imports: [DocumentModule],
  controllers: [PurchasingController, PurchasingV2Controller, PriceListController],
  providers: [
    PurchaseOrderService,
    PurchaseReturnService,
    PurchaseReceiveEventHandler,
    PriceListService,
    ManagePurchasingUseCase,
    PurchasingMetricsService,
    { provide: 'PurchasingRepository', useClass: PrismaPurchasingRepository },
    { provide: 'PurchasingV2Repository', useClass: PrismaPurchasingV2Repository },
    { provide: 'PriceListRepository', useClass: PrismaPriceListRepository },
  ],
  exports: ['PurchasingRepository', 'PurchasingV2Repository', 'PriceListRepository'],
})
export class PurchasingModule {}
