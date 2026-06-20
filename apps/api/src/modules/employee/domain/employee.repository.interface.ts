import { Employee } from './employee.entity';

export interface CreateEmployeeData {
  tenantId: string;
  firstName: string;
  lastName: string;
  identityDoc: string;
  hireDate: string;
  department: string;
  position: string;
  baseSalary: number;
}

export interface EmployeeRepository {
  create(data: CreateEmployeeData): Promise<Employee>;
  findById(id: string): Promise<Employee | null>;
  findByTenant(tenantId: string): Promise<Employee[]>;
  update(id: string, data: Partial<Employee>): Promise<Employee>;
}
