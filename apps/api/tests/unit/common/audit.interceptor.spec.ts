import { of, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from '../../../src/common/audit/audit.interceptor';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';
const PARAM_ID = '22222222-2222-4222-8222-222222222222';

describe('AuditInterceptor', () => {
  const setup = (responseBody: any, params: Record<string, string> = {}) => {
    const prisma = { auditLog: { create: jest.fn().mockResolvedValue({}) } } as any;
    const interceptor = new AuditInterceptor(prisma);
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          originalUrl: '/api/v1/auth/activity',
          ip: '127.0.0.1',
          headers: {},
          body: undefined,
          user: {
            id: '33333333-3333-4333-8333-333333333333',
            effectiveTenantId: '44444444-4444-4444-8444-444444444444',
          },
          params,
        }),
      }),
    };
    const next: any = { handle: () => of(responseBody) };
    return { prisma, interceptor, context, next };
  };

  const intercept = async (responseBody: any, params?: Record<string, string>) => {
    const { prisma, interceptor, context, next } = setup(responseBody, params);
    await lastValueFrom(interceptor.intercept(context, next));
    await new Promise(setImmediate);
    return prisma.auditLog.create.mock.calls[0][0].data;
  };

  it('stores the entity id returned by the response', async () => {
    const data = await intercept({ id: ENTITY_ID });
    expect(data.entityId).toBe(ENTITY_ID);
  });

  it('falls back to the route param id', async () => {
    const data = await intercept({ status: 'ok' }, { id: PARAM_ID });
    expect(data.entityId).toBe(PARAM_ID);
  });

  it('stores null when the operation has no entity id', async () => {
    const data = await intercept({ status: 'ok' });
    expect(data.entityId).toBeNull();
  });

  it('ignores ids that are not UUIDs', async () => {
    const data = await intercept({ id: 'not-a-uuid' }, { id: 'unknown' });
    expect(data.entityId).toBeNull();
  });
});
