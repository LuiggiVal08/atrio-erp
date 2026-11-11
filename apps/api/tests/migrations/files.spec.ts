import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tenantId = '019a57c0-0000-7000-8000-000000000001';
const otherTenantId = '019a57c0-0000-7000-8000-000000000002';
const userId = '019a57c0-0000-7000-8000-000000000003';
const missingId = '019a57c0-0000-7000-8000-000000000004';
const productId = '019a57c0-0000-7000-8000-000000000005';
const otherTenantProductId = '019a57c0-0000-7000-8000-000000000006';

const fileData = {
  tenantId,
  uploadedById: userId,
  originalName: 'invoice.pdf',
  storageKey: `${tenantId}/invoice.pdf`,
  mimeType: 'application/pdf',
  sizeBytes: 3_000_000_000n,
  checksumSha256: 'a'.repeat(64),
};

describe('File metadata migration', () => {
  const schema = `file_test_${randomUUID().replace(/-/g, '')}`;
  let prisma: PrismaClient;
  let migration: string;

  beforeAll(() => {
    migration = ['20261106000000_add_files', '20261106000001_link_files_to_products']
      .map((name) => readFileSync(
        resolve(__dirname, `../../prisma/migrations/${name}/migration.sql`),
        'utf8',
      ))
      .join('\n');
    const url = new URL(process.env.DATABASE_URL!);
    url.searchParams.set('schema', schema);
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function withMigration<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const rollback = new Error('Rollback isolated file migration test');
    let result!: T;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
        await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
        await tx.$executeRawUnsafe('CREATE TABLE "tenants" ("id" UUID PRIMARY KEY)');
        await tx.$executeRawUnsafe('CREATE TABLE "users" ("id" UUID PRIMARY KEY)');
        await tx.$executeRawUnsafe('CREATE TABLE "products" ("id" UUID PRIMARY KEY, "tenant_id" UUID NOT NULL)');
        await tx.$executeRaw`INSERT INTO "tenants" ("id") VALUES (${tenantId}::uuid), (${otherTenantId}::uuid)`;
        await tx.$executeRaw`INSERT INTO "users" ("id") VALUES (${userId}::uuid)`;
        await tx.$executeRaw`INSERT INTO "products" ("id", "tenant_id") VALUES
          (${productId}::uuid, ${tenantId}::uuid), (${otherTenantProductId}::uuid, ${otherTenantId}::uuid)`;

        for (const statement of migration.split(';').map((sql) => sql.trim()).filter(Boolean)) {
          await tx.$executeRawUnsafe(statement);
        }

        result = await run(tx);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }

    return result;
  }

  it('stores metadata with UUID v7, bigint size and creation defaults', async () => {
    const file = await withMigration((tx) => tx.file.create({ data: fileData }));

    expect(file.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(file).toMatchObject({ ...fileData, deletedAt: null });
    expect(file.createdAt).toBeInstanceOf(Date);
  });

  it('rejects duplicate storage keys even across tenants', async () => {
    await expect(withMigration(async (tx) => {
      await tx.file.create({ data: fileData });
      return tx.file.create({ data: { ...fileData, tenantId: otherTenantId } });
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('requires an existing tenant', async () => {
    await expect(withMigration((tx) => tx.file.create({
      data: { ...fileData, tenantId: missingId },
    }))).rejects.toMatchObject({ code: 'P2003' });
  });

  it('requires an existing uploader', async () => {
    await expect(withMigration((tx) => tx.file.create({
      data: { ...fileData, uploadedById: missingId },
    }))).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects negative file sizes', async () => {
    await expect(withMigration((tx) => tx.file.create({
      data: { ...fileData, sizeBytes: -1n },
    }))).rejects.toThrow(/files_size_bytes_check/);
  });

  it('preserves metadata and storage key uniqueness after soft deletion', async () => {
    await withMigration(async (tx) => {
      const file = await tx.file.create({ data: fileData });
      const deletedAt = new Date();
      const deleted = await tx.file.update({ where: { id: file.id }, data: { deletedAt } });

      expect(deleted.deletedAt).toEqual(deletedAt);
      expect(await tx.file.count({ where: { tenantId, deletedAt: null } })).toBe(0);
      expect(await tx.file.findUnique({ where: { id: file.id } })).not.toBeNull();
      await expect(tx.file.create({ data: fileData })).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  it('prevents deleting a tenant referenced by a file', async () => {
    await expect(withMigration(async (tx) => {
      await tx.file.create({ data: fileData });
      return tx.$executeRaw`DELETE FROM "tenants" WHERE "id" = ${tenantId}::uuid`;
    })).rejects.toMatchObject({ code: 'P2010', meta: { code: '23503' } });
  });

  it('prevents deleting an uploader referenced by a file', async () => {
    await expect(withMigration(async (tx) => {
      await tx.file.create({ data: fileData });
      return tx.$executeRaw`DELETE FROM "users" WHERE "id" = ${userId}::uuid`;
    })).rejects.toMatchObject({ code: 'P2010', meta: { code: '23503' } });
  });

  it('keeps files independent from products', async () => {
    await withMigration(async (tx) => {
      const file = await tx.file.create({ data: fileData });
      const columns = await tx.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = ${schema} AND table_name = 'files'
      `;

      expect(file).not.toHaveProperty('productId');
      expect(columns.map((column) => column.column_name)).not.toContain('product_id');
      expect(await tx.productFile.count()).toBe(0);
    });
  });

  it('links multiple files to one product through a separate association', async () => {
    await withMigration(async (tx) => {
      const first = await tx.file.create({ data: fileData });
      const second = await tx.file.create({
        data: { ...fileData, storageKey: `${tenantId}/manual.pdf` },
      });
      await tx.productFile.createMany({
        data: [
          { tenantId, productId, fileId: first.id },
          { tenantId, productId, fileId: second.id },
        ],
      });
      const product = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        select: { fileLinks: { where: { tenantId, file: { deletedAt: null } }, select: { fileId: true } } },
      });

      expect(product.fileLinks).toHaveLength(2);
      expect(product.fileLinks).toEqual(expect.arrayContaining([{ fileId: first.id }, { fileId: second.id }]));
    });
  });

  it('requires an existing product when linking a file', async () => {
    await expect(withMigration(async (tx) => {
      const file = await tx.file.create({ data: fileData });
      return tx.productFile.create({ data: { tenantId, productId: missingId, fileId: file.id } });
    })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('requires an existing file when linking a product', async () => {
    await expect(withMigration((tx) => tx.productFile.create({
      data: { tenantId, productId, fileId: missingId },
    }))).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects linking a product from another tenant', async () => {
    await expect(withMigration(async (tx) => {
      const file = await tx.file.create({ data: fileData });
      return tx.productFile.create({ data: { tenantId, productId: otherTenantProductId, fileId: file.id } });
    })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects linking a file from another tenant', async () => {
    await expect(withMigration(async (tx) => {
      const file = await tx.file.create({ data: { ...fileData, tenantId: otherTenantId } });
      return tx.productFile.create({ data: { tenantId, productId, fileId: file.id } });
    })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('allows only one product association per file', async () => {
    await expect(withMigration(async (tx) => {
      await tx.$executeRaw`INSERT INTO "products" ("id", "tenant_id") VALUES (${missingId}::uuid, ${tenantId}::uuid)`;
      const file = await tx.file.create({ data: fileData });
      await tx.productFile.create({ data: { tenantId, productId, fileId: file.id } });
      return tx.productFile.create({ data: { tenantId, productId: missingId, fileId: file.id } });
    })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows unlinking a product without deleting the file', async () => {
    await withMigration(async (tx) => {
      const file = await tx.file.create({ data: fileData });
      await tx.productFile.create({ data: { tenantId, productId, fileId: file.id } });
      await tx.productFile.delete({ where: { tenantId_fileId: { tenantId, fileId: file.id } } });

      expect(await tx.file.findUnique({ where: { id: file.id } })).toMatchObject({
        ...fileData, id: file.id, deletedAt: null,
      });
      expect(await tx.productFile.count()).toBe(0);
    });
  });

  it('prevents deleting a product referenced by a file association', async () => {
    await expect(withMigration(async (tx) => {
      const file = await tx.file.create({ data: fileData });
      await tx.productFile.create({ data: { tenantId, productId, fileId: file.id } });
      return tx.$executeRaw`DELETE FROM "products" WHERE "id" = ${productId}::uuid`;
    })).rejects.toMatchObject({ code: 'P2010', meta: { code: '23503' } });
  });
});
