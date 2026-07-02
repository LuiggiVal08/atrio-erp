import { Module } from '@nestjs/common';
import { SalesController } from './infrastructure/sales.controller';
import { PrismaSalesRepository } from './infrastructure/prisma-sales.repository';
import { PrismaCommissionRepository } from './infrastructure/prisma-commission.repository';
import { SalesOrderService } from './application/sales-order.service';
import { SalesInvoiceService } from './application/sales-invoice.service';
import { CommissionService } from './application/commission.service';

@Module({
  imports: [],
  controllers: [SalesController],
  providers: [
    SalesOrderService,
    SalesInvoiceService,
    CommissionService,
    { provide: 'SalesRepository', useClass: PrismaSalesRepository },
    { provide: 'CommissionRepository', useClass: PrismaCommissionRepository },
  ],
  exports: ['SalesRepository', 'CommissionRepository'],
})
export class SalesModule {}
