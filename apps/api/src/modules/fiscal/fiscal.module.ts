import { Module } from '@nestjs/common';
import { FiscalController } from './infrastructure/fiscal.controller';
import { FiscalService } from './domain/fiscal.service';
import { FiscalProcessorService } from './application/fiscal-processor.service';

@Module({
  controllers: [FiscalController],
  providers: [FiscalService, FiscalProcessorService],
  exports: [FiscalService, FiscalProcessorService],
})
export class FiscalModule {}
