import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from, switchMap, tap } from 'rxjs';
import { PrismaService } from '@/infrastructure/database/prisma.service';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTION_SEGMENTS = new Set([
  'complete', 'dispatch', 'receive', 'cancel', 'sync', 'adjust', 'approve', 'reject',
  'pay', 'void', 'generate', 'upload', 'delete', 'restore', 'assign', 'remove', 'close',
  'open', 'activate', 'deactivate', 'confirm', 'reset', 'login', 'logout',
]);
const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'refreshToken', 'refreshTokenHash', 'token', 'accessToken',
  'secret', 'apiKey', 'answerHash', 'mfaSecret', 'twoFactorSecret',
]);
const ENTITY_MODELS: Record<string, string> = {
  products: 'product',
  categories: 'productCategory',
  brands: 'productBrand',
  warehouses: 'warehouse',
  branches: 'branch',
  transfers: 'stockTransfer',
  'reorder-points': 'reorderPoint',
  'storage-locations': 'storageLocation',
  movements: 'stockMovement',
  stock: 'stock',
  taxes: 'localizationTax',
  'currency-rates': 'currencyRate',
  clients: 'client',
  vendors: 'vendor',
  partners: 'partner',
  employees: 'employee',
  users: 'user',
  roles: 'role',
  'cash-registers': 'cashRegister',
  'payment-methods': 'paymentMethod',
  'sales-orders': 'salesOrder',
  documents: 'document',
  'purchase-orders': 'purchaseOrder',
  departments: 'department',
  positions: 'position',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, headers } = request;
    const user = request.user;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const route = this.parseRoute(originalUrl);
    const entityId = this.resolveEntityId(undefined, request.params);
    const shouldLoadBefore = ['PUT', 'PATCH', 'DELETE'].includes(method) && !!entityId;

    const before$ = shouldLoadBefore
      ? from(this.loadBefore(route.entityType, entityId, user?.effectiveTenantId))
      : from([null]);

    return before$.pipe(
      switchMap((before) => next.handle().pipe(
        tap(async (responseBody) => {
          try {
            if (!user) return;
            const finalEntityId = this.resolveEntityId(responseBody, request.params) ?? entityId;
            await this.prisma.auditLog.create({
              data: {
                entityType: route.entityType,
                entityId: finalEntityId,
                resource: route.resource,
                action: this.mapMethodToAction(method),
                before,
                after: responseBody ? this.sanitize(responseBody) : null,
                userId: user.id,
                tenantId: user.effectiveTenantId,
                ipAddress: ip,
                userAgent: headers['user-agent']?.substring(0, 255) || null,
              },
            });
          } catch (error) {
            console.error('Audit log failed:', error);
          }
        }),
      )),
    );
  }

  private async loadBefore(entityType: string, entityId: string, tenantId?: string): Promise<any | null> {
    const model = ENTITY_MODELS[entityType];
    if (!model) return null;
    const delegate = (this.prisma as any)[model];
    if (!delegate || typeof delegate.findFirst !== 'function') return null;
    try {
      const record = await delegate.findFirst({ where: { id: entityId } });
      if (!record) return null;
      if (tenantId && record.tenantId && record.tenantId !== tenantId) return null;
      return this.sanitize(record);
    } catch {
      return null;
    }
  }

  private parseRoute(url: string): { entityType: string; resource: string } {
    const path = url.split('?')[0];
    const segments = path.split('/').filter(Boolean);
    const versionIndex = segments.findIndex((segment) => /^v\d+$/i.test(segment));
    const scoped = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;
    const resourceSegments = scoped.map((segment) => UUID_PATTERN.test(segment) ? ':id' : segment);
    const entitySegments = scoped.filter((segment) => !UUID_PATTERN.test(segment) && !ACTION_SEGMENTS.has(segment.toLowerCase()));
    const entityType = entitySegments[entitySegments.length - 1] ?? 'Unknown';
    return { entityType, resource: `/${resourceSegments.join('/')}` };
  }

  private resolveEntityId(responseBody: any, params: Record<string, string> = {}): string | null {
    const candidates = [responseBody?.id, params?.id];
    return candidates.find((value) => typeof value === 'string' && UUID_PATTERN.test(value)) ?? null;
  }

  private safeClone(value: any): any {
    return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item));
  }

  private sanitize(value: any): any {
    const clone = this.safeClone(value);
    const redact = (item: any) => {
      if (!item || typeof item !== 'object') return;
      if (Array.isArray(item)) {
        item.forEach(redact);
        return;
      }
      for (const key of Object.keys(item)) {
        if (SENSITIVE_KEYS.has(key)) {
          item[key] = '[REDACTED]';
        } else {
          redact(item[key]);
        }
      }
    };
    redact(clone);
    return clone;
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
