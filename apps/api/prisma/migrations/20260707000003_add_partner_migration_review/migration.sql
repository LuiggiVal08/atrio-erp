-- Create partner_migration_review table for manual review queue
CREATE TABLE "partner_migration_review" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" TEXT NOT NULL,
    "legacy_type" TEXT NOT NULL,
    "legacy_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_migration_review_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "partner_migration_review_batch_id_idx" ON "partner_migration_review"("batch_id");
CREATE INDEX "partner_migration_review_status_idx" ON "partner_migration_review"("status");
