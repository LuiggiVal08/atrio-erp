export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  tenantId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  identityDoc: string;
  identificationType: string | null;
  taxIdentifier: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  hireDate: Date;
  department: string;
  position: string;
  baseSalary: number;
  status: EmployeeStatus;
  managerEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
