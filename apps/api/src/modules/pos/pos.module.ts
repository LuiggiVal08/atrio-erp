import { Module } from '@nestjs/common';
import { PosController } from './infrastructure/pos.controller';
import { PrismaPosRepository } from './infrastructure/prisma-pos.repository';
import { PosSessionService } from './application/pos-session.service';
import { QuickSaleService } from './application/quick-sale.service';

@Module({
  imports: [],
  controllers: [PosController],
  providers: [
    PosSessionService,
    QuickSaleService,
    { provide: 'PosRepository', useClass: PrismaPosRepository },
  ],
  exports: ['PosRepository'],
})
export class PosModule {}
