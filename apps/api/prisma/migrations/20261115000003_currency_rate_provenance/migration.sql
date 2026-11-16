ALTER TABLE "currency_rates"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN "provider" TEXT;
