import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { ManageEmployeeUseCase } from '../application/manage-employee.use-case';
import { PrismaEmployeeRepository } from './prisma-employee.repository';
import { EmployeeTenantGuard } from './employee-tenant.guard';
import { EmployeeSetupService } from './employee-setup.service';

export const EMPLOYEE_REPOSITORY = 'EMPLOYEE_REPOSITORY';

@Module({
  controllers: [EmployeeController],
  providers: [
    EmployeeTenantGuard, EmployeeSetupService,
    { provide: EMPLOYEE_REPOSITORY, useClass: PrismaEmployeeRepository },
    {
      provide: ManageEmployeeUseCase,
      useFactory: (repo: any) => new ManageEmployeeUseCase(repo),
      inject: [EMPLOYEE_REPOSITORY],
    },
  ],
  exports: [],
})
export class EmployeeModule {}
