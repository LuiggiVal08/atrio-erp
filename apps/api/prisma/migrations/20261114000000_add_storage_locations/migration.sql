-- CreateEnum
CREATE TYPE "StorageLocationType" AS ENUM ('AISLE', 'SHELF', 'LEVEL', 'BIN');

-- AlterTable: tenant default warehouse
ALTER TABLE "tenants" ADD COLUMN "default_warehouse_id" UUID;

-- CreateTable: physical location tree
CREATE TABLE "storage_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "parent_id" UUID,
    "type" "StorageLocationType" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "path" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storage_locations_tenant_id_warehouse_id_type_idx" ON "storage_locations"("tenant_id", "warehouse_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_warehouse_id_path_key" ON "storage_locations"("warehouse_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_default_warehouse_id_key" ON "tenants"("default_warehouse_id");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_default_warehouse_id_fkey" FOREIGN KEY ("default_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: turn each warehouse's flat aisle/shelf/level/bin into a 4-level tree.
WITH wh AS (
    SELECT
        id AS warehouse_id,
        tenant_id,
        COALESCE(NULLIF(aisle, ''), 'A') AS aisle,
        COALESCE(NULLIF(shelf, ''), '1') AS shelf,
        COALESCE(NULLIF(level, ''), '1') AS level,
        COALESCE(NULLIF(bin, ''), '01') AS bin
    FROM "warehouses"
    WHERE aisle IS NOT NULL OR shelf IS NOT NULL OR level IS NOT NULL OR bin IS NOT NULL
),
aisles AS (
    INSERT INTO "storage_locations" ("id", "tenant_id", "warehouse_id", "parent_id", "type", "code", "path", "updated_at")
    SELECT gen_random_uuid(), tenant_id, warehouse_id, NULL, 'AISLE', aisle, aisle, now()
    FROM wh
    RETURNING "id", "warehouse_id", "path"
),
shelves AS (
    INSERT INTO "storage_locations" ("id", "tenant_id", "warehouse_id", "parent_id", "type", "code", "path", "updated_at")
    SELECT gen_random_uuid(), w.tenant_id, w.warehouse_id, a."id", 'SHELF', w.shelf, a."path" || '/' || w.shelf, now()
    FROM wh w
    JOIN aisles a ON a."warehouse_id" = w.warehouse_id
    RETURNING "id", "warehouse_id", "path"
),
levels AS (
    INSERT INTO "storage_locations" ("id", "tenant_id", "warehouse_id", "parent_id", "type", "code", "path", "updated_at")
    SELECT gen_random_uuid(), w.tenant_id, w.warehouse_id, s."id", 'LEVEL', w.level, s."path" || '/' || w.level, now()
    FROM wh w
    JOIN shelves s ON s."warehouse_id" = w.warehouse_id
    RETURNING "id", "warehouse_id", "path"
)
INSERT INTO "storage_locations" ("id", "tenant_id", "warehouse_id", "parent_id", "type", "code", "path", "updated_at")
SELECT gen_random_uuid(), w.tenant_id, w.warehouse_id, l."id", 'BIN', w.bin, l."path" || '/' || w.bin, now()
FROM wh w
JOIN levels l ON l."warehouse_id" = w.warehouse_id;

-- Default warehouse per tenant: first active warehouse by creation date.
UPDATE "tenants" t
SET "default_warehouse_id" = w."id"
FROM (
    SELECT DISTINCT ON ("tenant_id") "tenant_id", "id"
    FROM "warehouses"
    WHERE "is_active" = true
    ORDER BY "tenant_id", "created_at" ASC, "id" ASC
) w
WHERE w."tenant_id" = t."id"
  AND t."default_warehouse_id" IS NULL;

-- Drop the old flat location columns.
ALTER TABLE "warehouses"
    DROP COLUMN "aisle",
    DROP COLUMN "bin",
    DROP COLUMN "level",
    DROP COLUMN "shelf";
