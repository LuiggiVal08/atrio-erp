-- Stock transfers
CREATE TABLE IF NOT EXISTS "stock_transfers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "from_warehouse_id" UUID NOT NULL,
  "to_warehouse_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ,
  CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stock_transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
  CONSTRAINT "stock_transfers_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT,
  CONSTRAINT "stock_transfers_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT,
  CONSTRAINT "stock_transfers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "stock_transfers_tenant_id_status_idx" ON "stock_transfers"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "stock_transfers_tenant_id_created_at_idx" ON "stock_transfers"("tenant_id", "created_at" DESC);

-- Reorder points
CREATE TABLE IF NOT EXISTS "reorder_points" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "warehouse_id" UUID NOT NULL,
  "min_quantity" DOUBLE PRECISION NOT NULL,
  "max_quantity" DOUBLE PRECISION NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "reorder_points_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reorder_points_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
  CONSTRAINT "reorder_points_product_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
  CONSTRAINT "reorder_points_warehouse_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT,
  CONSTRAINT "reorder_points_product_id_warehouse_id_key" UNIQUE ("product_id", "warehouse_id")
);
CREATE INDEX IF NOT EXISTS "reorder_points_tenant_id_is_active_idx" ON "reorder_points"("tenant_id", "is_active");

-- Bank accounts
CREATE TABLE IF NOT EXISTS "bank_accounts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "account_number" VARCHAR(100) NOT NULL,
  "bank_name" VARCHAR(255) NOT NULL,
  "account_type" VARCHAR(50) NOT NULL,
  "currency" VARCHAR(10) NOT NULL DEFAULT 'VED',
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bank_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "bank_accounts_tenant_id_is_active_idx" ON "bank_accounts"("tenant_id", "is_active");

-- Departments
CREATE TABLE IF NOT EXISTS "departments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
  CONSTRAINT "departments_tenant_id_name_key" UNIQUE ("tenant_id", "name")
);

-- Salary history
CREATE TABLE IF NOT EXISTS "salary_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "employee_id" UUID NOT NULL,
  "salary" DECIMAL(15, 2) NOT NULL,
  "effective_date" TIMESTAMPTZ NOT NULL,
  "reason" VARCHAR(100),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "salary_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "salary_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "salary_history_employee_id_effective_date_idx" ON "salary_history"("employee_id", "effective_date" DESC);

-- Add department_id to employees
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "department_id" UUID;
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;

-- Add commission_rate to payment_methods
ALTER TABLE "payment_methods" ADD COLUMN IF NOT EXISTS "commission_rate" DOUBLE PRECISION;
