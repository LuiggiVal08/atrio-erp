import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';

describe('Migration Compatibility', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);

    // Ensure migration is applied (self-heal)
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'partners'`,
    );
    if (tables.length === 0) {
      const fs = require('fs');
      const path = require('path');
      const sql: string = fs.readFileSync(
        path.resolve(__dirname, '../../prisma/migrations/20260707000001_add_business_partners/migration.sql'),
        'utf-8',
      );
      const statements = sql.replace(/^-- .*\n/gm, '').split(';').map((s) => s.trim()).filter((s) => s.length > 0);
      for (const stmt of statements) {
        try { await prisma.$executeRawUnsafe(stmt + ';'); } catch { /* skip if exists */ }
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should still have clients table intact', async () => {
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients'`,
    );
    expect(tables.length).toBe(1);
  });

  it('should still have vendors table intact', async () => {
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors'`,
    );
    expect(tables.length).toBe(1);
  });

  it('should still have the original Address table (not confused with partner_addresses)', async () => {
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'addresses'`,
    );
    expect(tables.length).toBe(1);
  });

  it('should have both new and old tables coexisting', async () => {
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
        AND table_name IN ('clients', 'vendors', 'addresses', 'partners', 'partner_roles', 'partner_tags', 'contacts', 'partner_addresses', 'partner_events', 'partner_migration_map')
        ORDER BY table_name`,
    );
    const names = tables.map((t) => t.table_name);
    expect(names).toContain('clients');
    expect(names).toContain('vendors');
    expect(names).toContain('addresses');
    expect(names).toContain('partners');
    expect(names).toContain('partner_roles');
    expect(names).toContain('partner_tags');
    expect(names).toContain('contacts');
    expect(names).toContain('partner_addresses');
    expect(names).toContain('partner_events');
    expect(names).toContain('partner_migration_map');
  });

  it('should not have modified existing FK constraints', async () => {
    const constraints = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_schema = 'public'
         AND table_name IN ('clients', 'vendors')
         AND constraint_type = 'FOREIGN KEY'`,
    );
    expect(constraints.length).toBeGreaterThanOrEqual(2);
  });
});
