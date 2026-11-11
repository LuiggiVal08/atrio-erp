import { createStateMachine } from '@/common/state-machine/state-machine';

export type EmploymentStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED' | 'ARCHIVED';

export type ChangeType =
  | 'RELATIONSHIP_STARTED' | 'CONTRACT_CREATED' | 'CONTRACT_RENEWED'
  | 'CONTRACT_TERMINATED' | 'COMPENSATION_CHANGED' | 'SCHEDULE_CHANGED'
  | 'STATUS_CHANGED' | 'POSITION_CHANGED' | 'RELATIONSHIP_TERMINATED'
  | 'RELATIONSHIP_SUSPENDED' | 'RELATIONSHIP_REACTIVATED';

export type EmploymentReason =
  | 'NEW_HIRE' | 'PROMOTION' | 'TRANSFER' | 'SALARY_REVIEW'
  | 'DISCIPLINARY_ACTION' | 'RESIGNATION' | 'LAYOFF' | 'RETIREMENT'
  | 'TEMPORARY_ASSIGNMENT' | 'CONTRACT_EXPIRATION' | 'MEDICAL_LEAVE'
  | 'PERSONAL_LEAVE' | 'ORGANIZATIONAL_RESTRUCTURE' | 'MERIT_INCREASE'
  | 'SCHEDULE_REVIEW' | 'MEDICAL_LEAVE_ENDED' | 'OTHER';

export const employmentStateMachine = createStateMachine<EmploymentStatus>({
  PENDING: ['ACTIVE'],
  ACTIVE: ['SUSPENDED', 'ON_LEAVE', 'TERMINATED'],
  SUSPENDED: ['ACTIVE', 'TERMINATED'],
  ON_LEAVE: ['ACTIVE', 'TERMINATED'],
  TERMINATED: ['ARCHIVED'],
  ARCHIVED: [],
});

export interface EmploymentRelationship {
  id: string;
  tenantId: string;
  employeeId: string;
  status: EmploymentStatus;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmploymentChange {
  id: string;
  relationshipId: string;
  changeType: ChangeType;
  reason: EmploymentReason;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  changedBy: string;
  createdAt: Date;
}
