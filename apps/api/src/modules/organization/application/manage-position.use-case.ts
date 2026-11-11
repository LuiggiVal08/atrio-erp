import { PositionRepository } from '../domain/position.repository.interface';

export class ManagePositionUseCase {
  constructor(private readonly positionRepository: PositionRepository) {}

  async create(data: {
    tenantId: string; departmentId?: string; name: string;
    code?: string; description?: string; isLeadership?: boolean;
  }) {
    return this.positionRepository.create(data);
  }

  async findById(id: string) {
    const position = await this.positionRepository.findById(id);
    if (!position) throw new Error('Position not found');
    return position;
  }

  async findByTenant(tenantId: string) {
    return this.positionRepository.findByTenant(tenantId);
  }

  async findByDepartment(departmentId: string) {
    return this.positionRepository.findByDepartment(departmentId);
  }

  async update(id: string, data: {
    departmentId?: string; name?: string; code?: string;
    description?: string; isLeadership?: boolean; active?: boolean;
  }) {
    const position = await this.positionRepository.findById(id);
    if (!position) throw new Error('Position not found');
    return this.positionRepository.update(id, data);
  }

  async createAssignment(data: {
    tenantId: string; employeeId: string; positionId: string;
    startDate: string; endDate?: string;
  }) {
    return this.positionRepository.createAssignment(data);
  }

  async findAssignmentsByEmployee(employeeId: string) {
    return this.positionRepository.findAssignmentsByEmployee(employeeId);
  }

  async findCurrentAssignment(employeeId: string) {
    return this.positionRepository.findCurrentAssignment(employeeId);
  }

  async endAssignment(id: string, endDate: string) {
    const assignment = await this.positionRepository.endAssignment(id, endDate);
    return assignment;
  }
}
