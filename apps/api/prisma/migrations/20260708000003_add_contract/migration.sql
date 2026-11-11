-- Create ContractType enum
DO $$ BEGIN
  CREATE TYPE "ContractType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FIXED_TERM', 'TEMPORARY', 'INTERNSHIP', 'PROBATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create contracts table
CREATE TABLE "contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "relationship_id" UUID NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "terminated_at" TIMESTAMPTZ,
    "reason" "EmploymentReason",
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contracts_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "employment_relationships"("id") ON DELETE CASCADE
);

CREATE INDEX "contracts_relationship_id_start_date_idx" ON "contracts"("relationship_id", "start_date");
CREATE INDEX "contracts_relationship_id_end_date_idx" ON "contracts"("relationship_id", "end_date");

-- Add new ChangeType values for contract events
ALTER TYPE "ChangeType" ADD VALUE IF NOT EXISTS 'CONTRACT_RENEWED';
ALTER TYPE "ChangeType" ADD VALUE IF NOT EXISTS 'CONTRACT_TERMINATED';
