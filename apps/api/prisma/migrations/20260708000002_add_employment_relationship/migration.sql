-- Create EmploymentStatus enum
DO $$ BEGIN
  CREATE TYPE "EmploymentStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TERMINATED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create ChangeType enum
DO $$ BEGIN
  CREATE TYPE "ChangeType" AS ENUM (
    'RELATIONSHIP_STARTED', 'CONTRACT_CREATED', 'CONTRACT_AMENDED',
    'COMPENSATION_CHANGED', 'SCHEDULE_CHANGED', 'STATUS_CHANGED',
    'POSITION_CHANGED', 'RELATIONSHIP_TERMINATED', 'RELATIONSHIP_SUSPENDED',
    'RELATIONSHIP_REACTIVATED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create EmploymentReason enum
DO $$ BEGIN
  CREATE TYPE "EmploymentReason" AS ENUM (
    'NEW_HIRE', 'PROMOTION', 'TRANSFER', 'SALARY_REVIEW',
    'DISCIPLINARY_ACTION', 'RESIGNATION', 'LAYOFF', 'RETIREMENT',
    'TEMPORARY_ASSIGNMENT', 'CONTRACT_EXPIRATION', 'MEDICAL_LEAVE',
    'PERSONAL_LEAVE', 'ORGANIZATIONAL_RESTRUCTURE', 'MERIT_INCREASE',
    'SCHEDULE_REVIEW', 'MEDICAL_LEAVE_ENDED', 'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create employment_relationships table
CREATE TABLE "employment_relationships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_relationships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employment_relationships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "employment_relationships_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);

CREATE INDEX "employment_relationships_tenant_id_status_idx" ON "employment_relationships"("tenant_id", "status");
CREATE INDEX "employment_relationships_employee_id_idx" ON "employment_relationships"("employee_id");

-- Create employment_changes table
CREATE TABLE "employment_changes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "relationship_id" UUID NOT NULL,
    "change_type" "ChangeType" NOT NULL,
    "reason" "EmploymentReason" NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "changed_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_changes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employment_changes_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "employment_relationships"("id") ON DELETE CASCADE
);

CREATE INDEX "employment_changes_relationship_id_created_at_idx" ON "employment_changes"("relationship_id", "created_at" DESC);

