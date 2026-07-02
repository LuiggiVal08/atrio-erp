import { Module } from '@nestjs/common';
import { SalesController } from './infrastructure/sales.controller';
import { PrismaSalesRepository } from './infrastructure/prisma-sales.repository';
import { PrismaCommissionRepository } from './infrastructure/prisma-commission.repository';
import { PrismaSalesReturnRepository } from './infrastructure/prisma-sales-return.repository';
import { SalesOrderService } from './application/sales-order.service';
import { SalesInvoiceService } from './application/sales-invoice.service';
import { CommissionService } from './application/commission.service';
import { SalesReturnService } from './application/sales-return.service';

@Module({
  imports: [],
  controllers: [SalesController],
  providers: [
    SalesOrderService,
    SalesInvoiceService,
    CommissionService,
    SalesReturnService,
    { provide: 'SalesRepository', useClass: PrismaSalesRepository },
    { provide: 'CommissionRepository', useClass: PrismaCommissionRepository },
    { provide: 'SalesReturnRepository', useClass: PrismaSalesReturnRepository },
  ],
  exports: ['SalesRepository', 'CommissionRepository', 'SalesReturnRepository'],
})
export class SalesModule {}
