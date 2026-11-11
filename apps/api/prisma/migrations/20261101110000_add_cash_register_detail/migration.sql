ALTER TABLE "cash_registers" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "cash_movements" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "cash_movements" ADD COLUMN IF NOT EXISTS "session_id" UUID;
CREATE INDEX IF NOT EXISTS "cash_movements_register_session_idx"
  ON "cash_movements" ("register_id", "session_id", "created_at");
