import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EmployeeRepository, CreateEmployeeData } from '../domain/employee.repository.interface';
import { Employee } from '../domain/employee.entity';

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
}
