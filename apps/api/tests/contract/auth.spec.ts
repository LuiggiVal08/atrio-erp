import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, seedTestData, cleanupTestData } from '../helpers/test-setup';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

describe('Auth API (contract)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login should return 401 for invalid credentials', async () => {
    const seed = await seedTestData(app);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrong', tenant: seed.tenantId })
      .expect(401);
    await cleanupTestData(app, seed);
  });
});
