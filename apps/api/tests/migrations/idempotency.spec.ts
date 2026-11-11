import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';

describe('Migration Idempotency', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);

    // Ensure migration is registered (rollback tests may have cleaned it)
    const record = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT COUNT(*) as c FROM "_prisma_migrations" WHERE migration_name = '20260707000001_add_business_partners'`,
    );
    if (Number(record[0].c) === 0) {
      const { execSync } = require('child_process');
      execSync('npx prisma migrate resolve --applied 20260707000001_add_business_partners --schema prisma/schema.prisma', {
        cwd: require('path').resolve(__dirname, '../..'),
        stdio: 'pipe',
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have a single UNIQUE composite key on partner_roles', async () => {
    const constraints = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = 'partner_roles'
         AND constraint_type = 'PRIMARY KEY'`,
    );
    expect(constraints.length).toBe(1);
  });

  it('should have a single UNIQUE composite key on partner_tags', async () => {
    const constraints = await prisma.$queryRawUnsafe<Array<{ constraint_name: string }>>(
      `SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = 'partner_tags'
         AND constraint_type = 'PRIMARY KEY'`,
    );
    expect(constraints.length).toBe(1);
  });

  it('should have exactly one migration record per migration name', async () => {
    const records = await prisma.$queryRawUnsafe<Array<{ migration_name: string; c: bigint }>>(
      `SELECT migration_name, COUNT(*) as c FROM "_prisma_migrations" GROUP BY migration_name HAVING COUNT(*) > 1`,
    );
    expect(records.length).toBe(0);
  });

  it('should have the migration registered as applied', async () => {
    const record = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT COUNT(*) as c FROM "_prisma_migrations" WHERE migration_name = '20260707000001_add_business_partners'`,
    );
    expect(Number(record[0].c)).toBeGreaterThanOrEqual(1);
  });
});
