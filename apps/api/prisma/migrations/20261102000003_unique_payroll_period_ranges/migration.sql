DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "payroll_periods"
    GROUP BY "tenant_id", "start_date", "end_date"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate payroll period ranges exist; resolve them before applying this migration';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "payroll_periods_tenant_id_start_date_end_date_key"
  ON "payroll_periods"("tenant_id", "start_date", "end_date");
