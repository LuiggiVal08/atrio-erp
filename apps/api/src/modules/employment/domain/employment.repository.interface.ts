import { EmploymentRelationship, EmploymentChange, EmploymentStatus, ChangeType, EmploymentReason } from './employment-relationship.entity';

export interface CreateRelationshipData {
  tenantId: string;
  employeeId: string;
  startDate: string;
  reason: EmploymentReason;
  changedBy: string;
}

export interface UpdateStatusData {
  relationshipId: string;
  newStatus: EmploymentStatus;
  endDate?: string;
  reason: EmploymentReason;
  changedBy: string;
}

export interface EmploymentRepository {
  create(data: CreateRelationshipData): Promise<EmploymentRelationship>;
  findById(id: string): Promise<EmploymentRelationship | null>;
  findByTenant(tenantId: string, status?: EmploymentStatus): Promise<EmploymentRelationship[]>;
  findByEmployee(employeeId: string): Promise<EmploymentRelationship[]>;
  updateStatus(relationshipId: string, newStatus: EmploymentStatus, endDate?: Date): Promise<EmploymentRelationship>;

  addChange(data: {
    relationshipId: string;
    changeType: ChangeType;
    reason: EmploymentReason;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    changedBy: string;
  }): Promise<EmploymentChange>;

  findChanges(relationshipId: string): Promise<EmploymentChange[]>;
}
