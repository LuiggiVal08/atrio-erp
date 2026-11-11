-- Add manager_employee_id for reporting hierarchy
ALTER TABLE "employees" ADD COLUMN "manager_employee_id" UUID;

-- Create positions table
CREATE TABLE "positions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "department_id" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "is_leadership" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "positions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL,
    CONSTRAINT "positions_tenant_id_code_key" UNIQUE ("tenant_id", "code")
);

CREATE INDEX "positions_tenant_id_idx" ON "positions"("tenant_id");
CREATE INDEX "positions_department_id_idx" ON "positions"("department_id");

-- Create position_assignments table
CREATE TABLE "position_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "position_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "position_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "position_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
    CONSTRAINT "position_assignments_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE
);

CREATE INDEX "position_assignments_tenant_id_idx" ON "position_assignments"("tenant_id");
CREATE INDEX "position_assignments_employee_id_start_date_idx" ON "position_assignments"("employee_id", "start_date" DESC);
CREATE INDEX "position_assignments_position_id_idx" ON "position_assignments"("position_id");

-- Add foreign key for manager_employee_id on employees
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_employee_id_fkey"
    FOREIGN KEY ("manager_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL;

