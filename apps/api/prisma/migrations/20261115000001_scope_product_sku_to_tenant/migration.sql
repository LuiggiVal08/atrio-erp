-- Scope product SKU identity to the tenant instead of the whole database.
-- Keep existing rows untouched; only replace the global unique index.
DROP INDEX IF EXISTS "products_sku_key";
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");
