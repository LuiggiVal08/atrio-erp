import { EmploymentRepository } from '../domain/employment.repository.interface';
import { employmentStateMachine, type EmploymentStatus } from '../domain/employment-relationship.entity';

export class ManageEmploymentUseCase {
  constructor(private readonly employmentRepository: EmploymentRepository) {}

  async create(data: {
    tenantId: string; employeeId: string; startDate: string;
    reason: string; changedBy: string;
  }) {
    const relationship = await this.employmentRepository.create(data as any);
    await this.employmentRepository.addChange({
      relationshipId: relationship.id,
      changeType: 'RELATIONSHIP_STARTED',
      reason: data.reason as any,
      newValue: { status: 'ACTIVE', startDate: data.startDate },
      changedBy: data.changedBy,
    });
    return this.employmentRepository.findById(relationship.id);
  }

  async findById(id: string) {
    const rel = await this.employmentRepository.findById(id);
    if (!rel) throw new Error('Employment relationship not found');
    return rel;
  }

  async findByTenant(tenantId: string, status?: string) {
    return this.employmentRepository.findByTenant(tenantId, status as any);
  }

  async findByEmployee(employeeId: string) {
    return this.employmentRepository.findByEmployee(employeeId);
  }

  async terminate(id: string, endDate: string, reason: string, changedBy: string) {
    return this.changeStatus(id, 'TERMINATED', reason, changedBy, endDate);
  }

  async suspend(id: string, reason: string, changedBy: string) {
    return this.changeStatus(id, 'SUSPENDED', reason, changedBy);
  }

  async reactivate(id: string, reason: string, changedBy: string) {
    return this.changeStatus(id, 'ACTIVE', reason, changedBy);
  }

  async getChanges(relationshipId: string) {
    return this.employmentRepository.findChanges(relationshipId);
  }

  private async changeStatus(
    id: string, newStatus: EmploymentStatus,
    reason: string, changedBy: string, endDate?: string,
  ) {
    const rel = await this.employmentRepository.findById(id);
    if (!rel) throw new Error('Employment relationship not found');
    if (!employmentStateMachine.canTransition(rel.status, newStatus)) {
      throw new Error(`Cannot transition from ${rel.status} to ${newStatus}`);
    }

    const previousValue = { status: rel.status, endDate: rel.endDate };
    const endDateObj = endDate ? new Date(endDate) : undefined;
    const updated = await this.employmentRepository.updateStatus(id, newStatus, endDateObj);

    const changeTypeMap: Record<string, string> = {
      TERMINATED: 'RELATIONSHIP_TERMINATED',
      SUSPENDED: 'RELATIONSHIP_SUSPENDED',
      ACTIVE: 'RELATIONSHIP_REACTIVATED',
    };
    const changeType = changeTypeMap[newStatus] || 'STATUS_CHANGED';

    await this.employmentRepository.addChange({
      relationshipId: id,
      changeType: changeType as any,
      reason: reason as any,
      previousValue: previousValue as any,
      newValue: { status: newStatus, endDate: endDateObj } as any,
      changedBy,
    });

    return updated;
  }
}
