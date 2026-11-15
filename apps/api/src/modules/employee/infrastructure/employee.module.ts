import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
      useFactory: (repo: any, events: EventEmitter2) => new ManageEmployeeUseCase(repo, events),
      inject: [EMPLOYEE_REPOSITORY, EventEmitter2],
    },
  ],
  exports: [],
})
export class EmployeeModule {}
