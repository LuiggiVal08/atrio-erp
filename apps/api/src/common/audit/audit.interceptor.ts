import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, headers } = request;
    const user = request.user;
    const tenantId = request.tenantId;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const originalBody = request.body ? JSON.parse(JSON.stringify(request.body)) : null;

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          if (!user) return;

          const entityType = this.extractEntityType(originalUrl);
          const entityId = responseBody?.id || request.params?.id;

          await this.prisma.auditLog.create({
            data: {
              entityType,
              entityId: entityId || 'unknown',
              action: this.mapMethodToAction(method),
              before: method === 'PATCH' || method === 'PUT' ? originalBody : null,
              after: responseBody || null,
              userId: user.id,
              tenantId: tenantId || user.tenantId,
              ipAddress: ip,
              userAgent: headers['user-agent']?.substring(0, 255) || null,
            },
          });
        } catch (error) {
          console.error('Audit log failed:', error);
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1]?.split('?')[0] || 'Unknown';
  }

  private mapMethodToAction(method: string): 'CREATE' | 'UPDATE' | 'DELETE' {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PUT':
      case 'PATCH': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return 'UPDATE';
    }
  }
}
