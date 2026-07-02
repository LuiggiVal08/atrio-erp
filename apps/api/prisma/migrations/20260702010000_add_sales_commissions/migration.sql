-- Add commission status enum type
DO $$ BEGIN
  CREATE TYPE "commission_status" AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add salesperson_id and commission_rate to sales_invoices
ALTER TABLE "sales_invoices"
  ADD COLUMN IF NOT EXISTS "salesperson_id" UUID,
  ADD COLUMN IF NOT EXISTS "commission_rate" DOUBLE PRECISION;

-- Create sales_commissions table
CREATE TABLE IF NOT EXISTS "sales_commissions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "salesperson_id" UUID NOT NULL,
  "invoice_total" DECIMAL(15, 2) NOT NULL,
  "commission_rate" DOUBLE PRECISION NOT NULL,
  "commission_amount" DECIMAL(15, 2) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'PYG',
  "status" "commission_status" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "paid_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "sales_commissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sales_commissions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE RESTRICT,
  CONSTRAINT "sales_commissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
);

-- Indexes (Prisma convention names)
CREATE INDEX IF NOT EXISTS "sales_commissions_tenant_id_status_idx" ON "sales_commissions"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "sales_commissions_salesperson_id_status_idx" ON "sales_commissions"("salesperson_id", "status");
CREATE INDEX IF NOT EXISTS "sales_commissions_tenant_id_created_at_idx" ON "sales_commissions"("tenant_id", "created_at" DESC);
