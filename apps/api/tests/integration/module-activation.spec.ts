import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { seedTestData, cleanupTestData, TestSeed } from '../helpers/test-setup';

describe('Module Activation (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seed: TestSeed;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (seed) await cleanupTestData(app, seed);
    await app.close();
  });

  it('should return 403 when accessing inventory without module enabled', async () => {
    seed = await seedTestData(app, { enabledModules: [] });

    await request(app.getHttpServer())
      .get('/api/v1/inventory/categories')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(403);
  });

  it('should return 200 after enabling the module', async () => {
    await prisma.tenant.update({
      where: { id: seed.tenantId },
      data: { enabledModules: ['inventory'] },
    });

    await request(app.getHttpServer())
      .get('/api/v1/inventory/categories')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);
  });
});
