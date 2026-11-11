import { Position } from './position.entity';
import { PositionAssignment } from './position-assignment.entity';

export interface CreatePositionData {
  tenantId: string;
  departmentId?: string;
  name: string;
  code?: string;
  description?: string;
  isLeadership?: boolean;
}

export interface UpdatePositionData {
  departmentId?: string;
  name?: string;
  code?: string;
  description?: string;
  isLeadership?: boolean;
  active?: boolean;
}

export interface CreateAssignmentData {
  tenantId: string;
  employeeId: string;
  positionId: string;
  startDate: string;
  endDate?: string;
}

export interface PositionRepository {
  create(data: CreatePositionData): Promise<Position>;
  findById(id: string): Promise<Position | null>;
  findByTenant(tenantId: string): Promise<Position[]>;
  findByDepartment(departmentId: string): Promise<Position[]>;
  update(id: string, data: UpdatePositionData): Promise<Position>;

  createAssignment(data: CreateAssignmentData): Promise<PositionAssignment>;
  findAssignmentsByEmployee(employeeId: string): Promise<PositionAssignment[]>;
  findCurrentAssignment(employeeId: string): Promise<PositionAssignment | null>;
  endAssignment(id: string, endDate: string): Promise<PositionAssignment>;
}
