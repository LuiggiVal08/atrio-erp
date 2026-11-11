/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `vendors` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IdentificationType" AS ENUM ('CI_VE', 'RIF_VE', 'PASS_VE', 'CC_CO', 'CE_CO', 'NIT_CO', 'TI_CO', 'PASS_CO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentStatus" ADD VALUE 'pending_fiscal';
ALTER TYPE "DocumentStatus" ADD VALUE 'posted';

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "address",
ADD COLUMN     "address_id" UUID,
ADD COLUMN     "contributor_type" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "identification_type" "IdentificationType",
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "middle_name" TEXT,
ADD COLUMN     "second_last_name" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "identification_type" "IdentificationType",
ADD COLUMN     "middle_name" TEXT,
ADD COLUMN     "second_last_name" TEXT;

-- AlterTable
ALTER TABLE "sales_invoices" ADD COLUMN     "cufe" TEXT,
ADD COLUMN     "dian_xml" TEXT,
ADD COLUMN     "fiscal_error" TEXT,
ADD COLUMN     "fiscal_number" TEXT,
ADD COLUMN     "fiscal_posted_at" TIMESTAMP(3),
ADD COLUMN     "fiscal_sent_at" TIMESTAMP(3),
ADD COLUMN     "fiscal_status" TEXT,
ADD COLUMN     "qr_url" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'VE';

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "address",
ADD COLUMN     "address_id" UUID,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_first_name" TEXT,
ADD COLUMN     "contact_identification_number" TEXT,
ADD COLUMN     "contact_identification_type" "IdentificationType",
ADD COLUMN     "contact_last_name" TEXT,
ADD COLUMN     "contact_middle_name" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "contact_second_last_name" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "identification_type" "IdentificationType",
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "middle_name" TEXT,
ADD COLUMN     "second_last_name" TEXT;

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'VE',
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_tax_details" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "tax_type" TEXT NOT NULL,
    "base_imponible" DECIMAL(18,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "is_withholding" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_tax_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_tax_details_invoice_id_idx" ON "invoice_tax_details"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_tax_details_tenant_id_idx" ON "invoice_tax_details"("tenant_id");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_tax_details" ADD CONSTRAINT "invoice_tax_details_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_tax_details" ADD CONSTRAINT "invoice_tax_details_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
