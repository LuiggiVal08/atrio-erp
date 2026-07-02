import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Reports Cleanup Expiry (integration)', () => {
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
    seed = await seedTestData(app);
  });

  afterAll(async () => {
    // Cleanup any test data we created
    await prisma.reportHistory.deleteMany({ where: { tenantId: seed.tenantId } }).catch(() => {});
    await cleanupTestData(app, seed);
    await app.close();
  });

  it('should find and delete expired history entries via cleanup service', async () => {
    // Create an expired history entry
    await prisma.reportHistory.create({
      data: {
        tenantId: seed.tenantId,
        requestedById: seed.userId,
        reportType: 'SALES',
        format: 'PDF',
        status: 'COMPLETED',
        minioBucket: `reports-${seed.tenantId}`,
        minioKey: 'exports/expired-test.pdf',
        fileSize: 512,
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    });

    const { ReportCleanupService } = await import('../../../src/modules/reports/application/report-cleanup.service');
    const cleanupService = app.get(ReportCleanupService);

    const deletedCount = await cleanupService.cleanupExpired();
    expect(deletedCount).toBeGreaterThanOrEqual(1);
  });
});
