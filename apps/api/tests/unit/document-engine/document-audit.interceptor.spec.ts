import { of } from 'rxjs';
import { DocumentAuditInterceptor } from '../../../src/modules/document-engine/infrastructure/document-audit.interceptor';
import { DocumentEventEmitter } from '../../../src/modules/document-engine/infrastructure/document-event-emitter';

describe('DocumentAuditInterceptor', () => {
  let interceptor: DocumentAuditInterceptor;
  let eventEmitter: jest.Mocked<DocumentEventEmitter>;

  const mockExecutionContext = (overrides: any = {}) => {
    const req = {
      method: overrides.method || 'POST',
      originalUrl: overrides.url || '/tenants/t1/documents',
      user: overrides.user !== undefined ? overrides.user : { id: 'user-1', tenantId: 't1' },
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : 't1',
      params: overrides.params || {},
      body: overrides.body || {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => null,
      getClass: () => null,
    } as any;
  };

  const mockCallHandler = (responseBody: any = { id: 'doc-1', documentType: 'sales_invoice' }) => ({
    handle: () => of(responseBody),
  });

  beforeEach(() => {
    eventEmitter = { emit: jest.fn() } as any;
    interceptor = new DocumentAuditInterceptor(eventEmitter);
  });

  it('should emit audit event on POST create document', (done) => {
    const context = mockExecutionContext({
      method: 'POST',
      url: '/tenants/t1/documents',
      body: { documentType: 'sales_invoice', lines: [] },
    });

    interceptor.intercept(context, mockCallHandler()).subscribe(() => {
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'document.audit',
        expect.objectContaining({
          eventType: 'document.created',
          tenantId: 't1',
          documentId: 'doc-1',
          triggeredBy: 'user-1',
        }),
      );
      done();
    });
  });

  it('should emit document.submitted on submit endpoint', (done) => {
    const context = mockExecutionContext({
      method: 'POST',
      url: '/tenants/t1/documents/doc-1/submit',
      params: { id: 'doc-1' },
    });

    interceptor.intercept(context, mockCallHandler()).subscribe(() => {
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'document.audit',
        expect.objectContaining({ eventType: 'document.submitted' }),
      );
      done();
    });
  });

  it('should emit document.approved on approve endpoint', (done) => {
    const context = mockExecutionContext({
      method: 'POST',
      url: '/tenants/t1/documents/doc-1/approve',
      params: { id: 'doc-1' },
    });

    interceptor.intercept(context, mockCallHandler()).subscribe(() => {
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'document.audit',
        expect.objectContaining({ eventType: 'document.approved' }),
      );
      done();
    });
  });

  it('should emit document.status-changed on transition endpoint', (done) => {
    const context = mockExecutionContext({
      method: 'POST',
      url: '/tenants/t1/documents/doc-1/transition',
      params: { id: 'doc-1' },
    });

    interceptor.intercept(context, mockCallHandler()).subscribe(() => {
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'document.audit',
        expect.objectContaining({ eventType: 'document.status-changed' }),
      );
      done();
    });
  });

  it('should skip GET requests', (done) => {
    const context = mockExecutionContext({ method: 'GET', url: '/tenants/t1/documents' });
    eventEmitter.emit.mockClear();

    interceptor.intercept(context, mockCallHandler()).subscribe(() => {
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      done();
    });
  });

  it('should skip when no user in request', (done) => {
    const context = mockExecutionContext({
      method: 'POST',
      user: null,
      url: '/tenants/t1/documents',
    });

    interceptor.intercept(context, mockCallHandler()).subscribe(() => {
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      done();
    });
  });
});
