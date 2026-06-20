import { EmployeeRepository, CreateEmployeeData } from '../domain/employee.repository.interface';

export class ManageEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async create(dto: CreateEmployeeData) {
    return this.employeeRepository.create(dto);
  }

  async findById(id: string) {
    return this.employeeRepository.findById(id);
  }

  async findByTenant(tenantId: string) {
    return this.employeeRepository.findByTenant(tenantId);
  }

  async softDelete(id: string) {
    const employee = await this.employeeRepository.findById(id);
    if (!employee || employee.deletedAt) throw new Error('Employee not found');
    return this.employeeRepository.update(id, {
      deletedAt: new Date(),
      status: 'inactive',
    } as any);
  }
}
