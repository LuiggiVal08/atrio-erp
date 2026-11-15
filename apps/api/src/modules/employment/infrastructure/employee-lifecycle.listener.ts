import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ManageEmploymentUseCase } from '../application/manage-employment.use-case';
import { PositionRepository } from '../../organization/domain/position.repository.interface';
import { EmploymentRepository } from '../domain/employment.repository.interface';

const TERMINABLE = new Set(['PENDING', 'ACTIVE', 'SUSPENDED', 'ON_LEAVE']);

@Injectable()
export class EmployeeLifecycleListener {
  private readonly logger = new Logger(EmployeeLifecycleListener.name);

  constructor(
    @Inject('EMPLOYMENT_REPOSITORY') private readonly employmentRepository: EmploymentRepository,
    @Inject('POSITION_REPOSITORY') private readonly positionRepository: PositionRepository,
    private readonly manageEmployment: ManageEmploymentUseCase,
  ) {}

  @OnEvent('employee.deactivated')
  async handleDeactivated(payload: {
    employeeId: string;
    tenantId: string;
    deleted?: boolean;
    effectiveDate?: string;
  }) {
    const effectiveDate = payload.effectiveDate ?? new Date().toISOString().slice(0, 10);
    const relationships = await this.employmentRepository.findByEmployee(payload.employeeId);

    for (const relationship of relationships) {
      if (relationship.tenantId !== payload.tenantId) continue;
      if (!TERMINABLE.has(relationship.status)) continue;
      await this.manageEmployment.terminate(relationship.id, effectiveDate, 'OTHER', 'system');
      this.logger.log(`Employment ${relationship.id} terminated after employee ${payload.employeeId} deactivation`);
    }

    const assignment = await this.positionRepository.findCurrentAssignment(payload.employeeId);
    if (assignment && assignment.tenantId === payload.tenantId && !assignment.endDate) {
      await this.positionRepository.endAssignment(assignment.id, effectiveDate);
      this.logger.log(`Position assignment ${assignment.id} ended after employee ${payload.employeeId} deactivation`);
    }
  }
}
