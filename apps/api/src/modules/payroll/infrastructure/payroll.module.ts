import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PayrollController } from './payroll.controller';
import { ManagePayrollUseCase } from '../application/manage-payroll.use-case';
import { PayrollSnapshotResolver } from '../application/payroll-snapshot-resolver';
import { PrismaPayrollRepository } from './prisma-payroll.repository';
import { PrismaEmploymentRepository } from '../../employment/infrastructure/prisma-employment.repository';
import { PrismaContractRepository } from '../../employment/infrastructure/prisma-contract.repository';
import { PrismaCompensationRepository } from '../../employment/infrastructure/prisma-compensation.repository';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CashPaymentsModule } from '../../cash-payments/cash-payments.module';
import { CashMovementService } from '../../cash-payments/application/cash-movement.service';
import { ReportsModule } from '../../reports/infrastructure/reports.module';
import {
  CONTRACT_REPOSITORY,
  COMPENSATION_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
} from '../../employment/infrastructure/employment.module';

export const PAYROLL_REPOSITORY = 'PAYROLL_REPOSITORY';

@Module({
  imports: [CashPaymentsModule, ReportsModule],
  controllers: [PayrollController],
  providers: [
    { provide: PAYROLL_REPOSITORY, useClass: PrismaPayrollRepository },
    { provide: EMPLOYMENT_REPOSITORY, useClass: PrismaEmploymentRepository },
    { provide: CONTRACT_REPOSITORY, useClass: PrismaContractRepository },
    { provide: COMPENSATION_REPOSITORY, useClass: PrismaCompensationRepository },
    PrismaService,
    PayrollSnapshotResolver,
    {
      provide: ManagePayrollUseCase,
      useFactory: (
        payrollRepo: any,
        employmentRepo: any,
        snapshotResolver: PayrollSnapshotResolver,
        eventEmitter: EventEmitter2,
        cashMovementService: CashMovementService,
      ) => new ManagePayrollUseCase(
        payrollRepo,
        employmentRepo,
        snapshotResolver,
        eventEmitter,
        cashMovementService,
      ),
      inject: [
        PAYROLL_REPOSITORY,
        EMPLOYMENT_REPOSITORY,
        PayrollSnapshotResolver,
        EventEmitter2,
        CashMovementService,
      ],
    },
  ],
  exports: [],
})
export class PayrollModule {}
