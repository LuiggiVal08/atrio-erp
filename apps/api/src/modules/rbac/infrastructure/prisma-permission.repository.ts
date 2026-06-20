import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PermissionRepository } from '../domain/permission.repository.interface';
import { Permission } from '../domain/permission.entity';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({ orderBy: { module: 'asc' } }) as any;
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.prisma.permission.findMany({ where: { id: { in: ids } } }) as any;
  }
}
