-- Create partner_migration_map table for ETL traceability
CREATE TABLE "partner_migration_map" (
    "legacy_type" TEXT NOT NULL,
    "legacy_id" TEXT NOT NULL,
    "partner_id" UUID NOT NULL,
    "migration_batch" TEXT NOT NULL,
    "matched_by" TEXT,
    "confidence" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_migration_map_pkey" PRIMARY KEY ("legacy_type", "legacy_id")
);

-- FK to partners table
ALTER TABLE "partner_migration_map"
    ADD CONSTRAINT "partner_migration_map_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
    ON DELETE CASCADE;

-- Indexes
CREATE INDEX "partner_migration_map_partner_id_idx" ON "partner_migration_map"("partner_id");
CREATE INDEX "partner_migration_map_migration_batch_idx" ON "partner_migration_map"("migration_batch");
