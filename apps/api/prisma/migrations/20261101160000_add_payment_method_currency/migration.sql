ALTER TABLE "payment_methods" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VED';

ALTER TABLE "cash_movements" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VED';
ALTER TABLE "cash_movements" ADD COLUMN IF NOT EXISTS "exchange_rate" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "cash_movements" ADD COLUMN IF NOT EXISTS "base_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "cash_movements"
SET "base_amount" = "amount"
WHERE "base_amount" = 0 AND "amount" <> 0;
