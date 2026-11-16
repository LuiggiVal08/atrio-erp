import { of, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from '../../../src/common/audit/audit.interceptor';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';
const PARAM_ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = '44444444-4444-4444-8444-444444444444';

type SetupOptions = {
  method?: string;
  url?: string;
  body?: any;
  responseBody?: any;
  params?: Record<string, string>;
  product?: any;
};

describe('AuditInterceptor', () => {
  const setup = ({ method = 'POST', url = '/api/v1/auth/activity', body, responseBody, params = {}, product }: SetupOptions) => {
    const prisma = {
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      product: { findFirst: jest.fn().mockResolvedValue(product ?? null) },
    } as any;
    const interceptor = new AuditInterceptor(prisma);
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          originalUrl: url,
          ip: '127.0.0.1',
          headers: {},
          body,
          user: { id: '33333333-3333-4333-8333-333333333333', effectiveTenantId: TENANT_ID },
          params,
        }),
      }),
    };
    const next: any = { handle: () => of(responseBody) };
    return { prisma, interceptor, context, next };
  };

  const intercept = async (options: SetupOptions) => {
    const { prisma, interceptor, context, next } = setup(options);
    await lastValueFrom(interceptor.intercept(context, next));
    await new Promise(setImmediate);
    return { data: prisma.auditLog.create.mock.calls[0]?.[0]?.data, prisma };
  };

  it('stores the entity id returned by the response', async () => {
    const { data } = await intercept({ responseBody: { id: ENTITY_ID } });
    expect(data.entityId).toBe(ENTITY_ID);
  });

  it('falls back to the route param id', async () => {
    const { data } = await intercept({ responseBody: { status: 'ok' }, params: { id: PARAM_ID } });
    expect(data.entityId).toBe(PARAM_ID);
  });

  it('stores null when the operation has no entity id', async () => {
    const { data } = await intercept({ responseBody: { status: 'ok' } });
    expect(data.entityId).toBeNull();
  });

  it('ignores ids that are not UUIDs', async () => {
    const { data } = await intercept({ responseBody: { id: 'not-a-uuid' }, params: { id: 'unknown' } });
    expect(data.entityId).toBeNull();
  });

  it('loads the real before state and redacts sensitive fields', async () => {
    const { data } = await intercept({
      method: 'PATCH',
      url: `/api/v1/inventory/products/${PARAM_ID}`,
      body: { name: 'New' },
      responseBody: { id: PARAM_ID, name: 'New', passwordHash: 'new-secret' },
      params: { id: PARAM_ID },
      product: { id: PARAM_ID, tenantId: TENANT_ID, name: 'Old', passwordHash: 'old-secret' },
    });
    expect(data).toMatchObject({
      entityType: 'products',
      resource: '/inventory/products/:id',
      action: 'UPDATE',
      before: { name: 'Old', passwordHash: '[REDACTED]' },
      after: { name: 'New', passwordHash: '[REDACTED]' },
    });
  });

  it('does not use the request body as before state when no record is found', async () => {
    const { data } = await intercept({
      method: 'PATCH',
      url: `/api/v1/inventory/products/${PARAM_ID}`,
      body: { name: 'New' },
      responseBody: { id: PARAM_ID },
      params: { id: PARAM_ID },
    });
    expect(data.before).toBeNull();
  });

  it('discards before state from another tenant', async () => {
    const { data } = await intercept({
      method: 'DELETE',
      url: `/api/v1/inventory/products/${PARAM_ID}`,
      responseBody: { id: PARAM_ID },
      params: { id: PARAM_ID },
      product: { id: PARAM_ID, tenantId: '55555555-5555-4555-8555-555555555555', name: 'Foreign' },
    });
    expect(data.before).toBeNull();
    expect(data.action).toBe('DELETE');
  });

  it('does not audit reads', async () => {
    const { data } = await intercept({ method: 'GET', responseBody: { id: ENTITY_ID } });
    expect(data).toBeUndefined();
  });
});
