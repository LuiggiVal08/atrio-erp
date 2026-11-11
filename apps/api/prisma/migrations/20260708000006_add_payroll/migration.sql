-- Create PayrollPeriodStatus enum
DO $$ BEGIN
  CREATE TYPE "PayrollPeriodStatus" AS ENUM ('OPEN', 'CALCULATING', 'LOCKED', 'PAID', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create payroll_periods table
CREATE TABLE "payroll_periods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payroll_periods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "one_open_per_tenant" UNIQUE ("tenant_id", "status")
);

CREATE INDEX "payroll_periods_tenant_id_start_date_idx" ON "payroll_periods"("tenant_id", "start_date");

-- Create payslips table
CREATE TABLE "payslips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "relationship_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "employee_name" TEXT NOT NULL,
    "contract_id" UUID,
    "compensation_agreement_id" UUID,
    "position_assignment_id" UUID,
    "department_id" UUID,
    "department_name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "base_salary" DECIMAL(12, 2) NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payslips_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE
);

CREATE INDEX "payslips_period_id_idx" ON "payslips"("period_id");
CREATE INDEX "payslips_relationship_id_idx" ON "payslips"("relationship_id");
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");
