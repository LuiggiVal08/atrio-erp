-- Not every audited operation targets a single entity (e.g. auth flows, bulk actions).
ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" DROP NOT NULL;
