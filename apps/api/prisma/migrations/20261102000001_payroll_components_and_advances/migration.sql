DO $$ BEGIN
  CREATE TYPE "PayrollFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollLineType" AS ENUM ('EARNING', 'DEDUCTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollCalculationMode" AS ENUM ('FIXED', 'BASE_PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PayrollLineSource" AS ENUM ('BASE', 'CONCEPT', 'LOAN', 'COMMISSION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "payroll_periods"
  ADD COLUMN IF NOT EXISTS "frequency" "PayrollFrequency" NOT NULL DEFAULT 'MONTHLY';

ALTER TABLE "payslips"
  ADD COLUMN IF NOT EXISTS "base_earnings" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "other_earnings" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_deductions" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "net_pay" DECIMAL(12, 2) NOT NULL DEFAULT 0;

UPDATE "payslips"
SET "base_earnings" = "base_salary", "net_pay" = "base_salary"
WHERE "base_earnings" = 0 AND "other_earnings" = 0 AND "total_deductions" = 0 AND "net_pay" = 0;

CREATE TABLE IF NOT EXISTS "payroll_concepts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "PayrollLineType" NOT NULL,
  "calculation_mode" "PayrollCalculationMode" NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL,
  "recurring" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_concepts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_concepts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "payroll_concepts_tenant_id_code_key"
  ON "payroll_concepts"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "payroll_concepts_tenant_id_is_active_idx"
  ON "payroll_concepts"("tenant_id", "is_active");

CREATE TABLE IF NOT EXISTS "payroll_inputs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "period_id" UUID NOT NULL,
  "relationship_id" UUID NOT NULL,
  "concept_id" UUID NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_inputs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_inputs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "payroll_inputs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE,
  CONSTRAINT "payroll_inputs_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "employment_relationships"("id") ON DELETE RESTRICT,
  CONSTRAINT "payroll_inputs_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "payroll_concepts"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "payroll_inputs_tenant_id_period_id_idx"
  ON "payroll_inputs"("tenant_id", "period_id");
CREATE INDEX IF NOT EXISTS "payroll_inputs_relationship_id_period_id_idx"
  ON "payroll_inputs"("relationship_id", "period_id");

CREATE TABLE IF NOT EXISTS "employee_loans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "relationship_id" UUID NOT NULL,
  "principal" DECIMAL(12, 2) NOT NULL,
  "outstanding_balance" DECIMAL(12, 2) NOT NULL,
  "installment_amount" DECIMAL(12, 2) NOT NULL,
  "installment_count" INTEGER NOT NULL,
  "paid_installments" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_loans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "employee_loans_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "employment_relationships"("id") ON DELETE RESTRICT,
  CONSTRAINT "employee_loans_installment_count_check" CHECK ("installment_count" > 0),
  CONSTRAINT "employee_loans_paid_installments_check" CHECK ("paid_installments" >= 0),
  CONSTRAINT "employee_loans_outstanding_balance_check" CHECK ("outstanding_balance" >= 0)
);

CREATE INDEX IF NOT EXISTS "employee_loans_tenant_id_relationship_id_is_active_idx"
  ON "employee_loans"("tenant_id", "relationship_id", "is_active");

CREATE TABLE IF NOT EXISTS "payslip_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "payslip_id" UUID NOT NULL,
  "type" "PayrollLineType" NOT NULL,
  "source" "PayrollLineSource" NOT NULL,
  "source_id" UUID,
  "concept_id" UUID,
  "payroll_input_id" UUID,
  "loan_id" UUID,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payslip_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payslip_lines_payslip_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "payslip_lines_payslip_id_idx" ON "payslip_lines"("payslip_id");

ALTER TABLE "cash_movements"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "cash_movements_idempotency_key_key"
  ON "cash_movements"("idempotency_key");
