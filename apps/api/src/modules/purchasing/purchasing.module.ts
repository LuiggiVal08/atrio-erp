import { Module } from '@nestjs/common';
import { PurchasingController } from './infrastructure/purchasing.controller';
import { PriceListController } from './infrastructure/price-list.controller';
import { PrismaPurchasingRepository } from './infrastructure/prisma-purchasing.repository';
import { PrismaPriceListRepository } from './infrastructure/prisma-price-list.repository';
import { PurchaseOrderService } from './application/purchase-order.service';
import { PurchaseReturnService } from './application/purchase-return.service';
import { PurchaseReceiveEventHandler } from './application/purchase-receive-event-handler';
import { PriceListService } from './application/price-list.service';

@Module({
  imports: [],
  controllers: [PurchasingController, PriceListController],
  providers: [
    PurchaseOrderService,
    PurchaseReturnService,
    PurchaseReceiveEventHandler,
    PriceListService,
    { provide: 'PurchasingRepository', useClass: PrismaPurchasingRepository },
    { provide: 'PriceListRepository', useClass: PrismaPriceListRepository },
  ],
  exports: ['PurchasingRepository', 'PriceListRepository'],
})
export class PurchasingModule {}
