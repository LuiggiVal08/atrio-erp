-- Create CompensationType enum
DO $$ BEGIN
  CREATE TYPE "CompensationType" AS ENUM ('SALARY', 'BONUS', 'ALLOWANCE', 'COMMISSION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create compensation_agreements table
CREATE TABLE "compensation_agreements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "relationship_id" UUID NOT NULL,
    "effective_date" TIMESTAMPTZ NOT NULL,
    "ended_at" TIMESTAMPTZ,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compensation_agreements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "compensation_agreements_relationship_id_fkey" FOREIGN KEY ("relationship_id") REFERENCES "employment_relationships"("id") ON DELETE CASCADE
);

CREATE INDEX "compensation_agreements_relationship_id_effective_date_idx" ON "compensation_agreements"("relationship_id", "effective_date");

-- Create compensation_components table
CREATE TABLE "compensation_components" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "type" "CompensationType" NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compensation_components_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "compensation_components_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "compensation_agreements"("id") ON DELETE CASCADE
);

CREATE INDEX "compensation_components_agreement_id_idx" ON "compensation_components"("agreement_id");
