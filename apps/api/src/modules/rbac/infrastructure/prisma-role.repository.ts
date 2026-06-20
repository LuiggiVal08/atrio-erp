import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RoleRepository, CreateRoleData, UpdateRoleData } from '../domain/role.repository.interface';
import { Role, RoleWithPermissions, UserRole } from '../domain/role.entity';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRoleData): Promise<RoleWithPermissions> {
    return this.prisma.role.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        permissions: {
          create: data.permissionIds.map((id) => ({ permissionId: id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    }) as any;
  }

  async findById(id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    }) as any;
  }

  async findByTenant(tenantId: string): Promise<RoleWithPermissions[]> {
    return this.prisma.role.findMany({
      where: { tenantId, isSystem: false },
      include: { permissions: { include: { permission: true } } },
    }) as any;
  }

  async findByName(tenantId: string, name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name } },
    }) as any;
  }

  async update(id: string, data: UpdateRoleData): Promise<Role> {
    return this.prisma.role.update({ where: { id }, data }) as any;
  }

  async remove(id: string): Promise<Role> {
    return this.prisma.role.update({ where: { id }, data: { isSystem: true } }) as any;
  }

  async assignToUser(roleId: string, userId: string): Promise<UserRole> {
    return this.prisma.userRole.create({ data: { roleId, userId } }) as any;
  }

  async removeFromUser(roleId: string, userId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({ where: { roleId, userId } });
  }
}
