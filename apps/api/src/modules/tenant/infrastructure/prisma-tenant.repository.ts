import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  TenantRepository,
  CreateTenantData,
  UpdateTenantData,
  CreateTenantWithAdminResult,
} from '../domain/tenant.repository.interface';
import { Tenant } from '../domain/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTenantData): Promise<CreateTenantWithAdminResult> {
    const passwordHash = await bcrypt.hash('TempPass123!', 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        legalName: data.legalName,
        taxId: data.taxId,
        baseCurrency: data.baseCurrency || 'VED',
        timezone: data.timezone || 'UTC',
        subscriptionPlan: data.subscriptionPlan || 'free',
        status: 'active',
      },
    });

    const adminUser = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.adminEmail,
        passwordHash,
        name: data.adminName,
        status: 'active',
      },
    });

    return { tenant: tenant as any, adminUser: { id: adminUser.id, email: adminUser.email, tenantId: adminUser.tenantId } };
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id, deletedAt: null },
    });
    return tenant as any;
  }

  async findAll(): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
    });
    return tenants as any;
  }

  async update(id: string, data: UpdateTenantData): Promise<Tenant> {
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: data as any,
    });
    return updated as any;
  }
}
