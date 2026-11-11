import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PositionRepository, CreatePositionData, UpdatePositionData, CreateAssignmentData } from '../domain/position.repository.interface';
import { Position } from '../domain/position.entity';
import { PositionAssignment } from '../domain/position-assignment.entity';

@Injectable()
export class PrismaPositionRepository implements PositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePositionData): Promise<Position> {
    try {
      const r = await this.prisma.position.create({
        data: {
          tenantId: data.tenantId,
          departmentId: data.departmentId ?? null,
          name: data.name,
          code: data.code ?? null,
          description: data.description ?? null,
          isLeadership: data.isLeadership ?? false,
        },
      });
      return new Position(r.id, r.tenantId, r.departmentId, r.name, r.code, r.description, r.isLeadership, r.active, r.createdAt, r.updatedAt);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new Error('Position code already exists in this tenant');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Position | null> {
    const r = await this.prisma.position.findUnique({ where: { id } });
    if (!r) return null;
    return new Position(r.id, r.tenantId, r.departmentId, r.name, r.code, r.description, r.isLeadership, r.active, r.createdAt, r.updatedAt);
  }

  async findByTenant(tenantId: string): Promise<Position[]> {
    const records = await this.prisma.position.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });
    return records.map(r => new Position(r.id, r.tenantId, r.departmentId, r.name, r.code, r.description, r.isLeadership, r.active, r.createdAt, r.updatedAt));
  }

  async findByDepartment(departmentId: string): Promise<Position[]> {
    const records = await this.prisma.position.findMany({
      where: { departmentId, active: true },
      orderBy: { name: 'asc' },
    });
    return records.map(r => new Position(r.id, r.tenantId, r.departmentId, r.name, r.code, r.description, r.isLeadership, r.active, r.createdAt, r.updatedAt));
  }

  async update(id: string, data: UpdatePositionData): Promise<Position> {
    const r = await this.prisma.position.update({ where: { id }, data: data as any });
    return new Position(r.id, r.tenantId, r.departmentId, r.name, r.code, r.description, r.isLeadership, r.active, r.createdAt, r.updatedAt);
  }

  async createAssignment(data: CreateAssignmentData): Promise<PositionAssignment> {
    const r = await this.prisma.positionAssignment.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        positionId: data.positionId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    return new PositionAssignment(r.id, r.tenantId, r.employeeId, r.positionId, r.startDate, r.endDate, r.createdAt);
  }

  async findAssignmentsByEmployee(employeeId: string): Promise<PositionAssignment[]> {
    const records = await this.prisma.positionAssignment.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
    return records.map(r => new PositionAssignment(r.id, r.tenantId, r.employeeId, r.positionId, r.startDate, r.endDate, r.createdAt));
  }

  async findCurrentAssignment(employeeId: string): Promise<PositionAssignment | null> {
    const r = await this.prisma.positionAssignment.findFirst({
      where: { employeeId, endDate: null },
      orderBy: { startDate: 'desc' },
    });
    if (!r) return null;
    return new PositionAssignment(r.id, r.tenantId, r.employeeId, r.positionId, r.startDate, r.endDate, r.createdAt);
  }

  async endAssignment(id: string, endDate: string): Promise<PositionAssignment> {
    const r = await this.prisma.positionAssignment.update({
      where: { id },
      data: { endDate: new Date(endDate) },
    });
    return new PositionAssignment(r.id, r.tenantId, r.employeeId, r.positionId, r.startDate, r.endDate, r.createdAt);
  }
}
