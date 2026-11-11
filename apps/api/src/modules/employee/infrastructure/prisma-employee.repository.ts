import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  EmployeePaymentDetails,
  EmployeePaymentDetailsData,
  EmployeeRepository,
  CreateEmployeeData,
} from '../domain/employee.repository.interface';
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
          middleName: data.middleName ?? null,
          lastName: data.lastName,
          secondLastName: data.secondLastName ?? null,
          identityDoc: data.identityDoc,
          identificationType: data.identificationType as any ?? null,
          taxIdentifier: data.taxIdentifier ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
          address: data.address ?? null,
          emergencyContactName: data.emergencyContactName ?? null,
          emergencyContactPhone: data.emergencyContactPhone ?? null,
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

  async findPaymentDetails(
    employeeId: string,
    tenantId: string,
  ): Promise<EmployeePaymentDetails | null> {
    const record = await this.prisma.employeePaymentAccount.findFirst({
      where: {
        employeeId,
        tenantId,
        isCurrent: true,
        employee: { deletedAt: null },
      },
      select: {
        id: true,
        employeeId: true,
        method: true,
        bankName: true,
        accountType: true,
        accountNumber: true,
        mobilePaymentPhone: true,
        effectiveFrom: true,
      },
    });
    if (!record) return null;
    return {
      ...record,
      accountType: record.accountType as EmployeePaymentDetails['accountType'],
      method: record.method as EmployeePaymentDetails['method'],
    };
  }

  async savePaymentDetails(
    employeeId: string,
    tenantId: string,
    changedById: string,
    data: EmployeePaymentDetailsData,
  ): Promise<EmployeePaymentDetails | null> {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: employeeId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!employee) return null;

      const now = new Date();
      await tx.employeePaymentAccount.updateMany({
        where: { employeeId, tenantId, isCurrent: true },
        data: { isCurrent: false, effectiveTo: now },
      });
      const record = await tx.employeePaymentAccount.create({
        data: {
          employeeId,
          tenantId,
          createdById: changedById,
          method: data.method,
          bankName: data.bankName?.trim() || null,
          accountType: data.accountType ?? null,
          accountNumber: data.accountNumber?.trim() || null,
          mobilePaymentPhone: data.mobilePaymentPhone?.trim() || null,
        },
        select: {
          id: true,
          employeeId: true,
          method: true,
          bankName: true,
          accountType: true,
          accountNumber: true,
          mobilePaymentPhone: true,
          effectiveFrom: true,
        },
      });
      return {
        ...record,
        accountType: record.accountType as EmployeePaymentDetails['accountType'],
        method: record.method as EmployeePaymentDetails['method'],
      };
    }, { isolationLevel: 'Serializable' });
  }

  async clearPaymentDetails(employeeId: string, tenantId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: employeeId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!employee) return false;
      await tx.employeePaymentAccount.updateMany({
        where: { employeeId, tenantId, isCurrent: true },
        data: { isCurrent: false, effectiveTo: new Date() },
      });
      return true;
    }, { isolationLevel: 'Serializable' });
  }

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
