-- Add snapshot fields to payslips table
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "employee_number" TEXT;
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "contract_type" TEXT;
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "position_id" UUID;
ALTER TABLE "payslips" ADD COLUMN IF NOT EXISTS "position_name" TEXT;

-- Set tenant_id from period relationship
UPDATE "payslips" SET "tenant_id" = (
  SELECT "tenant_id" FROM "payroll_periods" WHERE "payroll_periods"."id" = "payslips"."period_id"
);

ALTER TABLE "payslips" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "payslips" ADD CONSTRAINT "payslips_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "payslips_tenant_id_idx" ON "payslips"("tenant_id");
