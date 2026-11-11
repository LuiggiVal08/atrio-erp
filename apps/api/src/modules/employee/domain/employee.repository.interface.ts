import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { SalaryHistory } from './salary-history.entity';

export interface CreateEmployeeData {
  tenantId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identityDoc: string;
  identificationType?: string;
  taxIdentifier?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  hireDate: string;
  department: string;
  departmentId?: string;
  position: string;
  baseSalary: number;
}

export interface EmployeePaymentDetailsData {
  method: 'BANK' | 'MOBILE_PAYMENT';
  bankName?: string | null;
  accountType?: 'SAVINGS' | 'CHECKING' | 'OTHER' | null;
  accountNumber?: string | null;
  mobilePaymentPhone?: string | null;
}

export interface EmployeePaymentDetails extends EmployeePaymentDetailsData {
  id: string;
  employeeId: string;
  bankName: string | null;
  accountType: 'SAVINGS' | 'CHECKING' | 'OTHER' | null;
  accountNumber: string | null;
  effectiveFrom: Date;
}

export interface EmployeeRepository {
  create(data: CreateEmployeeData): Promise<Employee>;
  findById(id: string): Promise<Employee | null>;
  findByTenant(tenantId: string): Promise<Employee[]>;
  update(id: string, data: Partial<Employee>): Promise<Employee>;
  findPaymentDetails(employeeId: string, tenantId: string): Promise<EmployeePaymentDetails | null>;
  savePaymentDetails(
    employeeId: string,
    tenantId: string,
    changedById: string,
    data: EmployeePaymentDetailsData,
  ): Promise<EmployeePaymentDetails | null>;
  clearPaymentDetails(employeeId: string, tenantId: string): Promise<boolean>;

  createDepartment(data: { tenantId: string; name: string; description?: string }): Promise<import('./department.entity').Department>;
  findAllDepartments(tenantId: string): Promise<import('./department.entity').Department[]>;
  findDepartmentById(id: string): Promise<import('./department.entity').Department | null>;
  updateDepartment(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<import('./department.entity').Department>;
  deleteDepartment(id: string): Promise<void>;

  createSalaryEntry(data: { employeeId: string; salary: number; effectiveDate: string; reason?: string }): Promise<import('./salary-history.entity').SalaryHistory>;
  findSalaryHistory(employeeId: string): Promise<import('./salary-history.entity').SalaryHistory[]>;
}
