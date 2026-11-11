import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EmploymentRepository, CreateRelationshipData } from '../domain/employment.repository.interface';
import { EmploymentRelationship, EmploymentChange, type EmploymentStatus } from '../domain/employment-relationship.entity';

@Injectable()
export class PrismaEmploymentRepository implements EmploymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRelationshipData): Promise<EmploymentRelationship> {
    return (await this.prisma.employmentRelationship.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        startDate: new Date(data.startDate),
        status: 'ACTIVE',
      },
    })) as any;
  }

  async findById(id: string): Promise<EmploymentRelationship | null> {
    return (await this.prisma.employmentRelationship.findUnique({ where: { id } })) as any;
  }

  async findByTenant(tenantId: string, status?: EmploymentStatus): Promise<EmploymentRelationship[]> {
    const where: any = { tenantId };
    if (status) where.status = status;
    return (await this.prisma.employmentRelationship.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })) as any;
  }

  async findByEmployee(employeeId: string): Promise<EmploymentRelationship[]> {
    return (await this.prisma.employmentRelationship.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    })) as any;
  }

  async updateStatus(relationshipId: string, newStatus: EmploymentStatus, endDate?: Date): Promise<EmploymentRelationship> {
    return (await this.prisma.employmentRelationship.update({
      where: { id: relationshipId },
      data: { status: newStatus as any, endDate: endDate ?? null },
    })) as any;
  }

  async addChange(data: {
    relationshipId: string; changeType: any; reason: any;
    previousValue?: any; newValue?: any; changedBy: string;
  }): Promise<EmploymentChange> {
    return (await this.prisma.employmentChange.create({
      data: {
        relationshipId: data.relationshipId,
        changeType: data.changeType,
        reason: data.reason,
        previousValue: data.previousValue ?? undefined,
        newValue: data.newValue ?? undefined,
        changedBy: data.changedBy,
      },
    })) as any;
  }

  async findChanges(relationshipId: string): Promise<EmploymentChange[]> {
    return (await this.prisma.employmentChange.findMany({
      where: { relationshipId },
      orderBy: { createdAt: 'desc' },
    })) as any;
  }
}
