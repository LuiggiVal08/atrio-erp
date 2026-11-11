import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from '../../../src/modules/health/infrastructure/health.controller';

describe('HealthController', () => {
  const prisma = { $queryRaw: jest.fn() };
  const redis = { status: 'ready', ping: jest.fn() };

  const createController = () => new HealthController(prisma as any, redis as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.status = 'ready';
    redis.ping.mockResolvedValue('PONG');
  });

  it('reports ok when database and redis are reachable', async () => {
    await expect(createController().check()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'up', redis: 'up' },
    });
  });

  it('throws 503 when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));

    await expect(createController().check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws 503 when redis is not ready', async () => {
    redis.status = 'connecting';

    await expect(createController().check()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(redis.ping).not.toHaveBeenCalled();
  });
});
