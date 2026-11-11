import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class TenantModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async getEnabledModules(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledModules: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { enabledModules: tenant.enabledModules };
  }

  async setEnabledModules(tenantId: string, enabledModules: string[]) {
    const validModules = ['reports', 'sales', 'inventory', 'cash-payments', 'cash', 'purchasing', 'purchases', 'localization', 'client-vendor', 'clients', 'vendors', 'documents', 'hr', 'employees', 'settings'];
    const invalid = enabledModules.filter((m) => !validModules.includes(m));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid modules: ${invalid.join(', ')}`);
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { enabledModules },
      select: { enabledModules: true },
    });
    return { enabledModules: tenant.enabledModules };
  }
}
