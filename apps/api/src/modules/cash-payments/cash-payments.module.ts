import { Module } from '@nestjs/common';
import { CashPaymentsController } from './infrastructure/cash-payments.controller';
import { PrismaCashPaymentsRepository } from './infrastructure/prisma-cash-payments.repository';
import { CashRegisterService } from './application/cash-register.service';
import { CashMovementService } from './application/cash-movement.service';
import { CashMovementEventHandler } from './application/cash-movement-event-handler';
import { BankAccountService } from './application/bank-account.service';

@Module({
  imports: [],
  controllers: [CashPaymentsController],
  providers: [
    CashRegisterService,
    CashMovementService,
    CashMovementEventHandler,
    BankAccountService,
    { provide: 'CashPaymentsRepository', useClass: PrismaCashPaymentsRepository },
    PrismaCashPaymentsRepository,
  ],
  exports: ['CashPaymentsRepository'],
})
export class CashPaymentsModule {}
