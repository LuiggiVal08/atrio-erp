import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { UserRepository, CreateUserData } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return (await this.prisma.user.create({ data: data as any })) as any;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new Error('Email already exists in this tenant');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    return (await this.prisma.user.findUnique({ where: { id } })) as any;
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return (await this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
    })) as any;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return (await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })) as any;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return (await this.prisma.user.update({
      where: { id },
      data: data as any,
    })) as any;
  }
}
