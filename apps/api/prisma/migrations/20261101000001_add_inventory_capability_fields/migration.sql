ALTER TABLE "products"
    ADD COLUMN "brand_id" UUID,
    ADD COLUMN "base_unit" TEXT NOT NULL DEFAULT 'unidad',
    ADD COLUMN "purchase_unit" TEXT,
    ADD COLUMN "conversion_factor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    ADD COLUMN "min_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "max_stock" DOUBLE PRECISION,
    ADD COLUMN "reorder_point" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "primary_supplier_id" UUID,
    ADD COLUMN "supplier_sku" TEXT;

ALTER TABLE "warehouses"
    ADD COLUMN "aisle" TEXT,
    ADD COLUMN "shelf" TEXT,
    ADD COLUMN "level" TEXT,
    ADD COLUMN "bin" TEXT;

ALTER TABLE "stock_movements"
    ADD COLUMN "lot_id" UUID,
    ADD COLUMN "balance_before" DOUBLE PRECISION,
    ADD COLUMN "balance_after" DOUBLE PRECISION;

CREATE TABLE "product_brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_brands_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_brands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "product_brands_tenant_id_name_key" ON "product_brands"("tenant_id", "name");

ALTER TABLE "products"
    ADD CONSTRAINT "products_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "product_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "product_suppliers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "supplier_sku" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_suppliers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_suppliers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_suppliers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "product_suppliers_product_id_partner_id_key" ON "product_suppliers"("product_id", "partner_id");
CREATE INDEX "product_suppliers_partner_id_idx" ON "product_suppliers"("partner_id");

CREATE TABLE "product_cost_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "supplier_id" UUID,
    "reference_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    CONSTRAINT "product_cost_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_cost_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "product_cost_history_tenant_product_created_idx" ON "product_cost_history"("tenant_id", "product_id", "created_at" DESC);

CREATE TABLE "stock_lots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "lot_number" TEXT,
    "serial_number" TEXT,
    "expiration_date" TIMESTAMPTZ,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_lots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "stock_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "stock_lots_product_warehouse_lot_key" ON "stock_lots"("product_id", "warehouse_id", "lot_number");
CREATE INDEX "stock_lots_tenant_expiration_idx" ON "stock_lots"("tenant_id", "expiration_date");
