import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip for unauthenticated routes (login, check-slug, etc.)
    if (!user) return true;

    const headerTenantId = request.headers['x-tenant-id'];

    if (!headerTenantId || headerTenantId === user.tenantId) {
      request.user.effectiveTenantId = user.tenantId;
      return true;
    }

    const access = await this.prisma.userAccess.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId: headerTenantId } },
    });

    if (access?.isActive) {
      request.user.effectiveTenantId = headerTenantId;
      return true;
    }

    throw new ForbiddenException('Access denied to this tenant');
  }
}
