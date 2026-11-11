-- Create ContractStatus enum
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create ContractReason enum
DO $$ BEGIN
  CREATE TYPE "ContractReason" AS ENUM ('RENEWAL', 'EXPIRATION', 'LEGAL_UPDATE', 'CORRECTION', 'TERMINATION', 'CANCELLATION', 'NEW_HIRE', 'TRANSFER', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE';

-- Add renewed_from_contract_id column
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "renewed_from_contract_id" UUID;

-- Change reason column type
ALTER TABLE "contracts" ALTER COLUMN "reason" TYPE "ContractReason" USING "reason"::text::"ContractReason";

-- Create index on status
CREATE INDEX IF NOT EXISTS "contracts_relationship_id_status_idx" ON "contracts"("relationship_id", "status");
