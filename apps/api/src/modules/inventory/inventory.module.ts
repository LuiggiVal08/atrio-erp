import { Module } from '@nestjs/common';
import { InventoryController } from './infrastructure/inventory.controller';
import { PrismaInventoryRepository } from './infrastructure/prisma-inventory.repository';
import { ProductCategoryService } from './application/product-category.service';
import { ProductService } from './application/product.service';
import { WarehouseService } from './application/warehouse.service';
import { StockService } from './application/stock.service';
import { StockEventHandler } from './application/stock-event-handler';
import { TransferService } from './application/transfer.service';
import { ReorderPointService } from './application/reorder-point.service';

@Module({
  imports: [],
  controllers: [InventoryController],
  providers: [
    ProductCategoryService,
    ProductService,
    WarehouseService,
    StockService,
    StockEventHandler,
    TransferService,
    ReorderPointService,
    { provide: 'InventoryRepository', useClass: PrismaInventoryRepository },
  ],
  exports: ['InventoryRepository'],
})
export class InventoryModule {}
