import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EmployeeRepository, CreateEmployeeData } from '../domain/employee.repository.interface';
import { Employee } from '../domain/employee.entity';
import { Department } from '../domain/department.entity';
import { SalaryHistory } from '../domain/salary-history.entity';

@Injectable()
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEmployeeData): Promise<Employee> {
    try {
      return (await this.prisma.employee.create({
        data: {
          tenantId: data.tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          identityDoc: data.identityDoc,
          hireDate: new Date(data.hireDate),
          department: data.department,
          departmentId: data.departmentId ?? null,
          position: data.position,
          baseSalary: data.baseSalary,
        },
      })) as any;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new Error('Identity document already exists in this tenant');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Employee | null> {
    return (await this.prisma.employee.findUnique({ where: { id } })) as any;
  }

  async findByTenant(tenantId: string): Promise<Employee[]> {
    return (await this.prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
    })) as any;
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return (await this.prisma.employee.update({
      where: { id },
      data: data as any,
    })) as any;
  }

  // Departments
  async createDepartment(data: { tenantId: string; name: string; description?: string }): Promise<Department> {
    const r = await this.prisma.department.create({ data: { ...data, description: data.description ?? null } });
    return new Department(r.id, r.tenantId, r.name, r.description, r.isActive, r.createdAt, r.updatedAt);
  }

  async findAllDepartments(tenantId: string): Promise<Department[]> {
    const records = await this.prisma.department.findMany({ where: { tenantId, isActive: true } });
    return records.map(r => new Department(r.id, r.tenantId, r.name, r.description, r.isActive, r.createdAt, r.updatedAt));
  }

  async findDepartmentById(id: string): Promise<Department | null> {
    const r = await this.prisma.department.findUnique({ where: { id } });
    if (!r) return null;
    return new Department(r.id, r.tenantId, r.name, r.description, r.isActive, r.createdAt, r.updatedAt);
  }

  async updateDepartment(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<Department> {
    const r = await this.prisma.department.update({ where: { id }, data });
    return new Department(r.id, r.tenantId, r.name, r.description, r.isActive, r.createdAt, r.updatedAt);
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.prisma.department.update({ where: { id }, data: { isActive: false } });
  }

  // Salary History
  async createSalaryEntry(data: { employeeId: string; salary: number; effectiveDate: string; reason?: string }): Promise<SalaryHistory> {
    const r = await this.prisma.salaryHistory.create({
      data: { employeeId: data.employeeId, salary: data.salary, effectiveDate: new Date(data.effectiveDate), reason: data.reason ?? null },
    });
    return new SalaryHistory(r.id, r.employeeId, Number(r.salary), r.effectiveDate, r.reason, r.createdAt);
  }

  async findSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    const records = await this.prisma.salaryHistory.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' },
    });
    return records.map(r => new SalaryHistory(r.id, r.employeeId, Number(r.salary), r.effectiveDate, r.reason, r.createdAt));
  }
}
