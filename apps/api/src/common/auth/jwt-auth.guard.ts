import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (user) {
      const headerTenantId = request.headers['x-tenant-id'];
      request.user = user;

      if (!headerTenantId || headerTenantId === user.tenantId) {
        request.user.effectiveTenantId = user.tenantId;
      } else {
        request.user.effectiveTenantId = headerTenantId;
      }
      return user;
    }
    if (err || info) {
      throw err || new UnauthorizedException(info?.message || 'Not authenticated');
    }
    throw new UnauthorizedException('Not authenticated');
  }
}
