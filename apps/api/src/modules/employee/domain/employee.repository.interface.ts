import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { SalaryHistory } from './salary-history.entity';

export interface CreateEmployeeData {
  tenantId: string;
  firstName: string;
  lastName: string;
  identityDoc: string;
  hireDate: string;
  department: string;
  departmentId?: string;
  position: string;
  baseSalary: number;
}

export interface EmployeeRepository {
  create(data: CreateEmployeeData): Promise<Employee>;
  findById(id: string): Promise<Employee | null>;
  findByTenant(tenantId: string): Promise<Employee[]>;
  update(id: string, data: Partial<Employee>): Promise<Employee>;

  // Departments
  createDepartment(data: { tenantId: string; name: string; description?: string }): Promise<Department>;
  findAllDepartments(tenantId: string): Promise<Department[]>;
  findDepartmentById(id: string): Promise<Department | null>;
  updateDepartment(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;

  // Salary History
  createSalaryEntry(data: { employeeId: string; salary: number; effectiveDate: string; reason?: string }): Promise<SalaryHistory>;
  findSalaryHistory(employeeId: string): Promise<SalaryHistory[]>;
}
