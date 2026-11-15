import { Module } from '@nestjs/common';
import { InventoryController } from './infrastructure/inventory.controller';
import { ProductImageController } from './infrastructure/product-image.controller';
import { ProductBrandImageController } from './infrastructure/product-brand-image.controller';
import { MinioStorageService } from '../reports/infrastructure/minio-storage.service';
import { PrismaInventoryRepository } from './infrastructure/prisma-inventory.repository';
import { ProductCategoryService } from './application/product-category.service';
import { ProductService } from './application/product.service';
import { WarehouseService } from './application/warehouse.service';
import { StorageLocationService } from './application/storage-location.service';
import { BranchService } from './application/branch.service';
import { StockService } from './application/stock.service';
import { StockEventHandler } from './application/stock-event-handler';
import { PurchasingEventHandler } from './application/purchasing-event-handler';
import { TransferService } from './application/transfer.service';
import { ReorderPointService } from './application/reorder-point.service';
import { InventorySummaryService } from './application/inventory-summary.service';
import { ProductBrandService } from './application/product-brand.service';

@Module({
  imports: [],
  controllers: [InventoryController, ProductImageController, ProductBrandImageController],
  providers: [
    ProductCategoryService,
    ProductService,
    WarehouseService,
    StorageLocationService,
    BranchService,
    StockService,
    StockEventHandler,
    PurchasingEventHandler,
    TransferService,
    ReorderPointService,
    InventorySummaryService,
    ProductBrandService,
    MinioStorageService,
    { provide: 'InventoryRepository', useClass: PrismaInventoryRepository },
  ],
  exports: ['InventoryRepository'],
})
export class InventoryModule {}
