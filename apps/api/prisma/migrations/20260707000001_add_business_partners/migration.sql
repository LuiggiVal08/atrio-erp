-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('PERSON', 'COMPANY');
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED');
CREATE TYPE "PartnerRoleType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'PROSPECT', 'DISTRIBUTOR', 'CARRIER', 'MANUFACTURER', 'CREDITOR');
CREATE TYPE "AddressType" AS ENUM ('FISCAL', 'BILLING', 'SHIPPING', 'BRANCH', 'PRIMARY', 'OTHER');

-- CreateTable partners
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "PartnerType" NOT NULL,
    "legal_name" TEXT NOT NULL,
    "tax_id_value" TEXT,
    "tax_id_country" CHAR(2),
    "tax_id_type" TEXT,
    "commercial_name" TEXT,
    "website" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata_source" TEXT,
    "metadata_notes" TEXT,
    "external_id" TEXT,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable partner_roles
CREATE TABLE "partner_roles" (
    "partner_id" UUID NOT NULL,
    "role" "PartnerRoleType" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_roles_pkey" PRIMARY KEY ("partner_id","role")
);

-- CreateTable partner_tags
CREATE TABLE "partner_tags" (
    "partner_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "partner_tags_pkey" PRIMARY KEY ("partner_id","value")
);

-- CreateTable contacts
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable partner_addresses
CREATE TABLE "partner_addresses" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "type" "AddressType" NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "postal_code" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "partner_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable partner_events
CREATE TABLE "partner_events" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,
    CONSTRAINT "partner_events_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "partners_tenant_id_status_idx" ON "partners"("tenant_id", "status");
CREATE INDEX "partners_tenant_id_legal_name_idx" ON "partners"("tenant_id", "legal_name");
CREATE UNIQUE INDEX "partners_tenant_id_tax_id_value_tax_id_country_tax_id_type_key" ON "partners"("tenant_id", "tax_id_value", "tax_id_country", "tax_id_type");
CREATE INDEX "contacts_partner_id_idx" ON "contacts"("partner_id");
CREATE INDEX "partner_addresses_partner_id_idx" ON "partner_addresses"("partner_id");
CREATE INDEX "partner_events_partner_id_occurred_at_idx" ON "partner_events"("partner_id", "occurred_at" DESC);

-- Foreign keys
ALTER TABLE "partners" ADD CONSTRAINT "partners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partners" ADD CONSTRAINT "partners_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partners" ADD CONSTRAINT "partners_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_roles" ADD CONSTRAINT "partner_roles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_tags" ADD CONSTRAINT "partner_tags_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_addresses" ADD CONSTRAINT "partner_addresses_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_addresses" ADD CONSTRAINT "partner_addresses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_addresses" ADD CONSTRAINT "partner_addresses_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "partner_events" ADD CONSTRAINT "partner_events_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_events" ADD CONSTRAINT "partner_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
