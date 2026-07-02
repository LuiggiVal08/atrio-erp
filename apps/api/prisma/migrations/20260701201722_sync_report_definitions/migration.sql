/*
  Warnings:

  - You are about to drop the column `description` on the `report_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `report_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `report_executions` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `report_executions` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `report_executions` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `report_executions` table. All the data in the column will be lost.
  - You are about to drop the column `report_id` on the `report_executions` table. All the data in the column will be lost.
  - You are about to drop the `report_history_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scheduled_reports` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `created_by_id` to the `report_definitions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `report_definition_id` to the `report_executions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "report_executions" DROP CONSTRAINT "report_executions_report_id_fkey";

-- DropForeignKey
ALTER TABLE "report_history_entries" DROP CONSTRAINT "report_history_entries_execution_id_fkey";

-- DropForeignKey
ALTER TABLE "report_history_entries" DROP CONSTRAINT "report_history_entries_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_reports" DROP CONSTRAINT "scheduled_reports_report_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_reports" DROP CONSTRAINT "scheduled_reports_tenant_id_fkey";

-- DropIndex
DROP INDEX "report_executions_tenant_id_created_at_idx";

-- DropIndex
DROP INDEX "report_executions_tenant_id_expires_at_idx";

-- AlterTable
ALTER TABLE "document_lines" ADD COLUMN     "received_quantity" DECIMAL(15,4);

-- AlterTable
ALTER TABLE "report_definitions" DROP COLUMN "description",
DROP COLUMN "is_active",
ADD COLUMN     "created_by_id" UUID NOT NULL,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
ADD COLUMN     "recipients" TEXT[],
ADD COLUMN     "schedule" TEXT;

-- AlterTable
ALTER TABLE "report_executions" DROP COLUMN "expires_at",
DROP COLUMN "file_url",
DROP COLUMN "filters",
DROP COLUMN "format",
DROP COLUMN "report_id",
ADD COLUMN     "minio_bucket" TEXT,
ADD COLUMN     "minio_key" TEXT,
ADD COLUMN     "report_definition_id" UUID NOT NULL,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "task_id" TEXT;

-- DropTable
DROP TABLE "report_history_entries";

-- DropTable
DROP TABLE "scheduled_reports";

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_lists" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vendor_id" UUID,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_items" (
    "id" UUID NOT NULL,
    "price_list_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "filters" JSONB,
    "minio_bucket" TEXT NOT NULL,
    "minio_key" TEXT NOT NULL,
    "file_size" INTEGER,
    "status" "ReportExecutionStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "position_x" INTEGER NOT NULL DEFAULT 0,
    "position_y" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 2,
    "height" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_returns_tenant_id_purchase_order_id_idx" ON "purchase_returns"("tenant_id", "purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_returns_tenant_id_created_at_idx" ON "purchase_returns"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "price_lists_tenant_id_is_active_idx" ON "price_lists"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "price_lists_tenant_id_name_idx" ON "price_lists"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "price_list_items_product_id_idx" ON "price_list_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_items_price_list_id_product_id_key" ON "price_list_items"("price_list_id", "product_id");

-- CreateIndex
CREATE INDEX "report_history_tenant_id_expires_at_idx" ON "report_history"("tenant_id", "expires_at");

-- CreateIndex
CREATE INDEX "dashboard_widgets_tenant_id_user_id_idx" ON "dashboard_widgets"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "report_executions_report_definition_id_idx" ON "report_executions"("report_definition_id");

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_definitions" ADD CONSTRAINT "report_definitions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_report_definition_id_fkey" FOREIGN KEY ("report_definition_id") REFERENCES "report_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
