import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EmployeePaymentDetailsData,
  EmployeeRepository,
  CreateEmployeeData,
} from '../domain/employee.repository.interface';

export class ManageEmployeeUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly events?: EventEmitter2,
  ) {}

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
    const updated = await this.employeeRepository.update(id, {
      deletedAt: new Date(),
      status: 'inactive',
    } as any);
    await this.emitDeactivated(employee, true);
    return updated;
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
    const updated = await this.employeeRepository.update(id, data as any);
    if (data.status === 'inactive' && employee.status !== 'inactive') {
      await this.emitDeactivated(employee, false);
    }
    return updated;
  }

  private async emitDeactivated(employee: { id: string; tenantId: string }, deleted: boolean) {
    await this.events?.emitAsync('employee.deactivated', {
      employeeId: employee.id,
      tenantId: employee.tenantId,
      deleted,
      effectiveDate: new Date().toISOString().slice(0, 10),
    });
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
