ALTER TABLE "pos_sessions"
  ADD COLUMN IF NOT EXISTS "opening_denominations" JSONB;
