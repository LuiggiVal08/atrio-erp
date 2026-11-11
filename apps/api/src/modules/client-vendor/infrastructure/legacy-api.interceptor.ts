import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const LEGACY_ENDPOINT_USED = 'legacy.endpoint.used';

/**
 * Adds HTTP deprecation headers to legacy /clients and /vendors endpoints
 * and emits `legacy.endpoint.used` events for observability.
 *
 * Headers added:
 * - `Deprecation: true`  signals the endpoint is deprecated
 * - `Sunset`             indicates planned removal (Dec 2027)
 * - `Link`               suggests the successor version (/api/v1/partners)
 */
@Injectable()
export class LegacyApiInterceptor implements NestInterceptor {
  constructor(
    @Optional() @Inject(EventEmitter2) private readonly eventEmitter?: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const path = request.route?.path ?? request.url ?? '';

    const isLegacy = path.includes('/clients') || path.includes('/vendors') || path.includes('/client-vendor');

    if (!isLegacy) return next.handle();

    const method = request.method ?? 'GET';
    const tenantId = request.user?.effectiveTenantId ?? request.user?.tenantId ?? 'unknown';
    const userId = request.user?.sub ?? 'anonymous';

    setImmediate(() => {
      this.eventEmitter?.emit(LEGACY_ENDPOINT_USED, {
        endpoint: path,
        method,
        tenantId,
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    return next.handle().pipe(
      map((data) => {
        response.setHeader('Sunset', 'Sat, 31 Dec 2027 23:59:59 GMT');
        response.setHeader('Deprecation', 'true');
        response.setHeader('Link', '</api/v1/partners>; rel="successor-version"');
        return data;
      }),
    );
  }
}
