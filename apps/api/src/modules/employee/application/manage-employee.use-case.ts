import {
  EmployeePaymentDetailsData,
  EmployeeRepository,
  CreateEmployeeData,
} from '../domain/employee.repository.interface';

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

  findPaymentDetails(employeeId: string, tenantId: string) {
    return this.employeeRepository.findPaymentDetails(employeeId, tenantId);
  }

  savePaymentDetails(
    employeeId: string,
    tenantId: string,
    changedById: string,
    data: EmployeePaymentDetailsData,
  ) {
    return this.employeeRepository.savePaymentDetails(employeeId, tenantId, changedById, data);
  }

  clearPaymentDetails(employeeId: string, tenantId: string) {
    return this.employeeRepository.clearPaymentDetails(employeeId, tenantId);
  }

  async softDelete(id: string) {
    const employee = await this.employeeRepository.findById(id);
    if (!employee || employee.deletedAt) throw new Error('Employee not found');
    return this.employeeRepository.update(id, {
      deletedAt: new Date(),
      status: 'inactive',
    } as any);
  }

  async update(id: string, data: Partial<{
    firstName: string; middleName: string; lastName: string; secondLastName: string;
    identityDoc: string; identificationType: string;
    taxIdentifier: string; phone: string; email: string; address: string;
    emergencyContactName: string; emergencyContactPhone: string;
    department: string; position: string; baseSalary: number; status: string;
  }>) {
    const employee = await this.employeeRepository.findById(id);
    if (!employee || employee.deletedAt) throw new Error('Employee not found');
    return this.employeeRepository.update(id, data as any);
  }

  async createDepartment(data: { tenantId: string; name: string; description?: string }) {
    return this.employeeRepository.createDepartment(data);
  }

  async findAllDepartments(tenantId: string) {
    return this.employeeRepository.findAllDepartments(tenantId);
  }

  async findDepartmentById(id: string) {
    const dept = await this.employeeRepository.findDepartmentById(id);
    if (!dept) throw new Error('Department not found');
    return dept;
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const dept = await this.employeeRepository.findDepartmentById(id);
    if (!dept) throw new Error('Department not found');
    return this.employeeRepository.updateDepartment(id, data);
  }

  async deleteDepartment(id: string) {
    const dept = await this.employeeRepository.findDepartmentById(id);
    if (!dept) throw new Error('Department not found');
    await this.employeeRepository.deleteDepartment(id);
  }

  async createSalaryEntry(data: { employeeId: string; salary: number; effectiveDate: string; reason?: string }) {
    return this.employeeRepository.createSalaryEntry(data);
  }

  async findSalaryHistory(employeeId: string) {
    return this.employeeRepository.findSalaryHistory(employeeId);
  }
}
