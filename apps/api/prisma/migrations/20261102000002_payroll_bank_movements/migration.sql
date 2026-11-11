CREATE TABLE IF NOT EXISTS "bank_movements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "bank_account_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(15, 2) NOT NULL,
  "currency" TEXT NOT NULL,
  "exchange_rate" DECIMAL(18, 8) NOT NULL DEFAULT 1,
  "account_amount" DECIMAL(15, 2) NOT NULL,
  "reference_type" TEXT,
  "reference_id" UUID,
  "idempotency_key" TEXT,
  "description" TEXT,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bank_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bank_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "bank_movements_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT,
  CONSTRAINT "bank_movements_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "bank_movements_account_amount_check" CHECK ("account_amount" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "bank_movements_idempotency_key_key"
  ON "bank_movements"("idempotency_key");
CREATE INDEX IF NOT EXISTS "bank_movements_tenant_id_bank_account_id_created_at_idx"
  ON "bank_movements"("tenant_id", "bank_account_id", "created_at");
