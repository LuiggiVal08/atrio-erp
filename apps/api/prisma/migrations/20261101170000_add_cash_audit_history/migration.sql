ALTER TABLE "pos_sessions"
  ADD COLUMN IF NOT EXISTS "closing_difference" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "closing_note" TEXT,
  ADD COLUMN IF NOT EXISTS "closing_denominations" JSONB;

ALTER TABLE "cash_movements"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "receipt_name" TEXT;
