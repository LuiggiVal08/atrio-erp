import * as crypto from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { TenantAccessGuard } from '../../src/common/guards/tenant-access.guard';

export interface TestSeed {
  tenantId: string;
  userId: string;
  token: string;
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const prismaService = app.get(PrismaService);
  app.useGlobalGuards(new TenantAccessGuard(prismaService));
  await app.init();
  return app;
}

const ALL_PERMISSIONS = [
  'inventory:product:create', 'inventory:product:read', 'inventory:product:update', 'inventory:product:delete',
  'inventory:category:create', 'inventory:category:read', 'inventory:category:update', 'inventory:category:delete',
  'inventory:brand:create', 'inventory:brand:read', 'inventory:brand:update', 'inventory:brand:delete',
  'inventory:warehouse:create', 'inventory:warehouse:read', 'inventory:warehouse:delete',
  'inventory:stock:read', 'inventory:stock:adjust',
  'client-vendor:client:create', 'client-vendor:client:read', 'client-vendor:client:update', 'client-vendor:client:delete',
  'client-vendor:vendor:create', 'client-vendor:vendor:read', 'client-vendor:vendor:update', 'client-vendor:vendor:delete',
  'localization:tax:create', 'localization:tax:read', 'localization:tax:update', 'localization:tax:delete',
  'localization:currency-rate:create', 'localization:currency-rate:read',
  'cash-payments:register:create', 'cash-payments:register:read', 'cash-payments:register:delete',
  'employee:bank-details:read', 'employee:bank-details:update',
  'cash-payments:payment-method:create', 'cash-payments:payment-method:read', 'cash-payments:payment-method:delete',
  'cash-payments:movement:create', 'cash-payments:movement:read',
  'sales:order:create', 'sales:order:read', 'sales:order:update', 'sales:order:delete',
  'sales:invoice:create', 'sales:invoice:read', 'sales:invoice:update', 'sales:invoice:delete', 'sales:invoice:approve', 'sales:invoice:pay',
  'purchasing:order:create', 'purchasing:order:read', 'purchasing:order:update', 'purchasing:order:delete', 'purchasing:order:approve', 'purchasing:order:receive', 'purchasing:order:return',
  'purchasing:price-list:create', 'purchasing:price-list:read', 'purchasing:price-list:update', 'purchasing:price-list:delete',
  'documents:create', 'documents:read', 'documents:submit', 'documents:approve', 'documents:reject',
  'documents:transition', 'documents:counter', 'documents:delete',
  'reports:dashboard:view', 'reports:dashboard:manage',
  'reports:export:request', 'reports:export:view',
  'reports:history:view', 'reports:history:delete',
  'reports:definitions:view', 'reports:definitions:manage', 'reports:definitions:execute',
];

export async function seedTestData(
  app: INestApplication,
  options?: { enabledModules?: string[] },
): Promise<TestSeed> {
  const prisma = app.get(PrismaService);
  const jwtService = app.get(JwtService);

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const roleId = crypto.randomUUID();

  await prisma.tenant.create({
    data: {
      id: tenantId,
      slug: `test-${uid}`,
      legalName: `Test Tenant ${uid}`,
      taxId: `J-${uid}`,
      enabledModules: options?.enabledModules ?? [
        'inventory', 'sales', 'purchasing', 'cash-payments', 'localization', 'client-vendor', 'documents',
      ],
    },
  });

  await prisma.user.create({
    data: {
      id: userId,
      tenantId,
      email: `admin-${uid}@test.com`,
      passwordHash: 'not-used',
      name: 'Test Admin',
      status: 'active',
    },
  });

  await prisma.role.create({
    data: {
      id: roleId,
      tenantId,
      name: 'test-admin',
      isSystem: true,
    },
  });

  for (const code of ALL_PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { code } });
    const permId = existing?.id || crypto.randomUUID();
    if (!existing) {
      await prisma.permission.create({
        data: {
          id: permId,
          code,
          name: code,
          module: code.split(':')[0],
          action: code.split(':').slice(1).join(':'),
        },
      });
    }
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permId } },
      update: {},
      create: { roleId, permissionId: permId },
    });
  }

  await prisma.userRole.create({
    data: { userId, roleId },
  });

  const token = jwtService.sign({
    sub: userId,
    tenantId,
    jti: crypto.randomUUID(),
  });

  return { tenantId, userId, token };
}

export async function cleanupTestData(app: INestApplication, seed: TestSeed): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.userRole.deleteMany({ where: { userId: seed.userId } }).catch(() => {});
  await prisma.rolePermission.deleteMany({
    where: { role: { tenantId: seed.tenantId } },
  }).catch(() => {});
  await prisma.user.deleteMany({ where: { tenantId: seed.tenantId } }).catch(() => {});
  await prisma.role.deleteMany({ where: { tenantId: seed.tenantId } }).catch(() => {});
  await prisma.tenant.deleteMany({ where: { id: seed.tenantId } }).catch(() => {});
}
