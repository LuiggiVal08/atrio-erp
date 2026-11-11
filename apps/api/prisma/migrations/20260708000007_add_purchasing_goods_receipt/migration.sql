-- CreateEnum
CREATE TYPE "PurchasingOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'RECEIVING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('PENDING', 'RECEIVED');

-- CreateTable
CREATE TABLE "purchasing_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "status" "PurchasingOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "supplier_id" UUID NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "supplier_tax_id" TEXT,
    "supplier_email" TEXT,
    "supplier_phone" TEXT,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchasing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchasing_order_lines" (
    "id" UUID NOT NULL,
    "purchasing_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_sku" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_unit" TEXT,
    "warehouse_id" UUID,
    "ordered_quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "received_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "purchasing_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "purchasing_order_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "received_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_lines" (
    "id" UUID NOT NULL,
    "goods_receipt_id" UUID NOT NULL,
    "purchasing_order_line_id" UUID NOT NULL,
    "received_quantity" DOUBLE PRECISION NOT NULL,
    "damaged_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "goods_receipt_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchasing_orders_tenant_id_status_idx" ON "purchasing_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "purchasing_orders_tenant_id_created_at_idx" ON "purchasing_orders"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "purchasing_order_lines_purchasing_order_id_idx" ON "purchasing_order_lines"("purchasing_order_id");

-- CreateIndex
CREATE INDEX "goods_receipts_tenant_id_status_idx" ON "goods_receipts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "goods_receipts_purchasing_order_id_idx" ON "goods_receipts"("purchasing_order_id");

-- CreateIndex
CREATE INDEX "goods_receipt_lines_goods_receipt_id_idx" ON "goods_receipt_lines"("goods_receipt_id");

-- AddForeignKey
ALTER TABLE "purchasing_order_lines" ADD CONSTRAINT "purchasing_order_lines_purchasing_order_id_fkey" FOREIGN KEY ("purchasing_order_id") REFERENCES "purchasing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchasing_order_id_fkey" FOREIGN KEY ("purchasing_order_id") REFERENCES "purchasing_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_purchasing_order_line_id_fkey" FOREIGN KEY ("purchasing_order_line_id") REFERENCES "purchasing_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
