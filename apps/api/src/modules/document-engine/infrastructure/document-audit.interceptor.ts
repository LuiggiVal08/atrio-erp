import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DocumentEventEmitter, DocumentEventPayload } from './document-event-emitter';

@Injectable()
export class DocumentAuditInterceptor implements NestInterceptor {
  constructor(private readonly eventEmitter: DocumentEventEmitter) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    const user = request.user;
    const tenantId = request.tenantId || user?.tenantId;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const documentId = request.params?.id;

    return next.handle().pipe(
      tap((responseBody) => {
        if (!user || !tenantId) return;

        const eventPayload: DocumentEventPayload = {
          eventType: this.mapRouteToEventType(method, originalUrl, responseBody),
          tenantId,
          documentId: documentId || responseBody?.id || 'unknown',
          documentType: responseBody?.documentType || request.body?.documentType || 'unknown',
          timestamp: new Date().toISOString(),
          triggeredBy: user.id,
          metadata: {
            method,
            originalUrl,
            action: this.mapMethodToAuditAction(method),
            before: method === 'PATCH' || method === 'PUT' ? request.body : undefined,
          },
        };

        this.eventEmitter.emit('document.audit', eventPayload);
      }),
    );
  }

  private mapRouteToEventType(method: string, url: string, responseBody: any): string {
    if (url.includes('/submit')) return 'document.submitted';
    if (url.includes('/approve')) return 'document.approved';
    if (url.includes('/reject')) return 'document.rejected';
    if (url.includes('/transition')) return 'document.status-changed';
    if (url.includes('/counter')) return 'document.counter-created';
    if (method === 'POST' && !url.includes('/:')) return 'document.created';
    if (method === 'DELETE') return 'document.deleted';
    if (method === 'PATCH' || method === 'PUT') return 'document.updated';
    return 'document.audit';
  }

  private mapMethodToAuditAction(method: string): string {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PUT':
      case 'PATCH': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return 'UPDATE';
    }
  }
}
