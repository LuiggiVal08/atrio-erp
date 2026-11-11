-- Drop the full unique constraint on (tenant_id, status)
-- Replace with partial unique index only for OPEN status

ALTER TABLE "payroll_periods" DROP CONSTRAINT IF EXISTS "one_open_per_tenant";
ALTER TABLE "payroll_periods" DROP CONSTRAINT IF EXISTS "payroll_periods_tenant_id_status_key";

CREATE UNIQUE INDEX "one_open_per_tenant" ON "payroll_periods" ("tenant_id") WHERE "status" = 'OPEN';
