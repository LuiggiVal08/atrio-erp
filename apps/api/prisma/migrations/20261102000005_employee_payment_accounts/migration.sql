CREATE TABLE "employee_payment_accounts" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "employee_id" UUID NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'BANK',
  "bank_name" TEXT,
  "account_type" TEXT,
  "account_number" TEXT,
  "mobile_payment_phone" TEXT,
  "created_by_id" UUID NOT NULL,
  "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effective_to" TIMESTAMP(3),
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_payment_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_payment_accounts_account_type_check"
    CHECK ("account_type" IS NULL OR "account_type" IN ('SAVINGS', 'CHECKING', 'OTHER')),
  CONSTRAINT "employee_payment_accounts_method_check"
    CHECK (
      ("method" = 'BANK' AND "bank_name" IS NOT NULL AND "account_type" IS NOT NULL AND "account_number" IS NOT NULL)
      OR ("method" = 'MOBILE_PAYMENT' AND "mobile_payment_phone" IS NOT NULL)
    )
);

CREATE INDEX "employee_payment_accounts_tenant_id_employee_id_is_current_idx"
  ON "employee_payment_accounts"("tenant_id", "employee_id", "is_current");
CREATE UNIQUE INDEX "employee_payment_accounts_one_current_per_employee_idx"
  ON "employee_payment_accounts"("employee_id") WHERE "is_current" = true;

ALTER TABLE "employee_payment_accounts"
  ADD CONSTRAINT "employee_payment_accounts_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_payment_accounts"
  ADD CONSTRAINT "employee_payment_accounts_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_payment_accounts"
  ADD CONSTRAINT "employee_payment_accounts_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
