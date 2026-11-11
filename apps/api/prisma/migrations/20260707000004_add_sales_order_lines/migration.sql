-- Alter sales_orders: add snapshot and exchange rate columns, make document_id nullable
ALTER TABLE "sales_orders" ALTER COLUMN "document_id" DROP NOT NULL;
ALTER TABLE "sales_orders" ADD COLUMN "exchange_rate" DOUBLE PRECISION;
ALTER TABLE "sales_orders" ADD COLUMN "customer_name" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "customer_tax_id" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "customer_address" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "customer_email" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "customer_phone" TEXT;

-- Create sales_order_lines table
CREATE TABLE "sales_order_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sales_order_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_sku" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "line_total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sales_order_lines_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE
);

CREATE INDEX "sales_order_lines_sales_order_id_idx" ON "sales_order_lines"("sales_order_id");

