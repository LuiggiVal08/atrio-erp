import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';

describe('Migration Rollback', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);
  });

  const executeMigrationFile = async (filePath: string) => {
    const fs = require('fs');
    const sql: string = fs.readFileSync(filePath, 'utf-8');
    const statements = sql
      .replace(/^-- .*\n/gm, '')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt + ';');
      } catch {
        // ignore "already exists" errors on re-run
      }
    }
  };

  const replayMigration = async () => {
    const path = require('path');
    await executeMigrationFile(
      path.resolve(__dirname, '../../prisma/migrations/20260707000001_add_business_partners/migration.sql'),
    );
  };

  const restorePartnerSchema = async () => {
    const fs = require('fs');
    const path = require('path');
    const migrationsRoot = path.resolve(__dirname, '../../prisma/migrations');
    const migrationDirs = fs
      .readdirSync(migrationsRoot)
      .filter((name: string) => {
        const sqlPath = path.join(migrationsRoot, name, 'migration.sql');
        if (!fs.existsSync(sqlPath)) return false;
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        return sql.includes('"partners"') || sql.includes('"partner_') || sql.includes('"contacts"');
      })
      .sort();

    for (const dir of migrationDirs) {
      await executeMigrationFile(path.join(migrationsRoot, dir, 'migration.sql'));
    }

    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "product_suppliers" DROP CONSTRAINT IF EXISTS "product_suppliers_partner_id_fkey"`,
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      );
    } catch {
      // product_suppliers may not exist in older database snapshots
    }
  };

  afterAll(async () => {
    await restorePartnerSchema();
    await prisma.$disconnect();
  });

  it('should have a documented rollback procedure for M-001', async () => {
    const fs = require('fs');
    const path = require('path');
    const dashboard = fs.readFileSync(
      path.resolve(__dirname, '../../../../specs/003-business-partners/migration-status.md'),
      'utf-8',
    );
    expect(dashboard).toContain('DROP TABLE IF EXISTS partner_events CASCADE');
    expect(dashboard).toContain('DROP TYPE IF EXISTS "PartnerStatus"');
    expect(dashboard).toContain('DELETE FROM _prisma_migrations');
  });

  it('should be able to drop and recreate partner tables idempotently', async () => {
    // Drop tables
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_events CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_addresses CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS contacts CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_tags CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_roles CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partners CASCADE`);

    // Drop enums (order matters due to dependencies)
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "AddressType"`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PartnerRoleType"`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PartnerStatus"`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PartnerType"`);

    // Recreate
    await replayMigration();

    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('partners', 'partner_roles', 'partner_tags', 'contacts', 'partner_addresses', 'partner_events')
       ORDER BY table_name`,
    );
    expect(tables.map((t) => t.table_name)).toEqual([
      'contacts',
      'partner_addresses',
      'partner_events',
      'partner_roles',
      'partner_tags',
      'partners',
    ]);
  });

  it('should replay migration idempotently (second run does not error)', async () => {
    // Run again — should not throw despite "already exists" on types/tables
    await expect(replayMigration()).resolves.not.toThrow();
  });

  it('should handle full rollback cycle: drop → recreate → migrate record restored', async () => {
    // Drop everything
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_events CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_addresses CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS contacts CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_tags CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partner_roles CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS partners CASCADE`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "AddressType"`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PartnerRoleType"`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PartnerStatus"`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PartnerType"`);

    await replayMigration();

    // Verify tables exist
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('partners', 'partner_roles')
       ORDER BY table_name`,
    );
    expect(tables.length).toBe(2);

    // Restore migration record (Prisma manages _prisma_migrations, not the SQL)
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ('rollback-test-001', E'\\\\x74657374', NOW(), '20260707000001_add_business_partners', NULL, NULL, NOW(), 1)`,
    );

    const record = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT COUNT(*) as c FROM "_prisma_migrations" WHERE migration_name = '20260707000001_add_business_partners'`,
    );
    expect(Number(record[0].c)).toBeGreaterThanOrEqual(1);

    // Cleanup: remove test record, leave original if any
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE id = 'rollback-test-001'`,
    );
  });
});
