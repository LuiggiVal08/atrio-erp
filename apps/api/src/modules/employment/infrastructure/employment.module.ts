import { Module } from '@nestjs/common';
import { EmployeeTenantGuard } from '../../employee/infrastructure/employee-tenant.guard';
import { EmploymentController } from './employment.controller';
import { ContractController } from './contract.controller';
import { CompensationController } from './compensation.controller';
import { ManageEmploymentUseCase } from '../application/manage-employment.use-case';
import { ManageContractUseCase } from '../application/manage-contract.use-case';
import { ManageCompensationUseCase } from '../application/manage-compensation.use-case';
import { PrismaEmploymentRepository } from './prisma-employment.repository';
import { PrismaContractRepository } from './prisma-contract.repository';
import { PrismaCompensationRepository } from './prisma-compensation.repository';

export const EMPLOYMENT_REPOSITORY = 'EMPLOYMENT_REPOSITORY';
export const CONTRACT_REPOSITORY = 'CONTRACT_REPOSITORY';
export const COMPENSATION_REPOSITORY = 'COMPENSATION_REPOSITORY';

@Module({
  controllers: [EmploymentController, ContractController, CompensationController],
  providers: [
    EmployeeTenantGuard,
    { provide: EMPLOYMENT_REPOSITORY, useClass: PrismaEmploymentRepository },
    { provide: CONTRACT_REPOSITORY, useClass: PrismaContractRepository },
    { provide: COMPENSATION_REPOSITORY, useClass: PrismaCompensationRepository },
    {
      provide: ManageEmploymentUseCase,
      useFactory: (repo: any) => new ManageEmploymentUseCase(repo),
      inject: [EMPLOYMENT_REPOSITORY],
    },
    {
      provide: ManageContractUseCase,
      useFactory: (contractRepo: any, employmentRepo: any) =>
        new ManageContractUseCase(contractRepo, employmentRepo),
      inject: [CONTRACT_REPOSITORY, EMPLOYMENT_REPOSITORY],
    },
    {
      provide: ManageCompensationUseCase,
      useFactory: (compensationRepo: any, employmentRepo: any) =>
        new ManageCompensationUseCase(compensationRepo, employmentRepo),
      inject: [COMPENSATION_REPOSITORY, EMPLOYMENT_REPOSITORY],
    },
  ],
  exports: [],
})
export class EmploymentModule {}
