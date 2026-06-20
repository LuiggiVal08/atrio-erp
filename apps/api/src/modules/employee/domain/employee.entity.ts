export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  identityDoc: string;
  hireDate: Date;
  department: string;
  position: string;
  baseSalary: number;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
