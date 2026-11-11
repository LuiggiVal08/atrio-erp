CREATE UNIQUE INDEX "products_tenant_id_id_key" ON "products"("tenant_id", "id");
CREATE UNIQUE INDEX "files_tenant_id_id_key" ON "files"("tenant_id", "id");

CREATE TABLE "product_files" (
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,

    CONSTRAINT "product_files_pkey" PRIMARY KEY ("tenant_id", "file_id")
);

CREATE INDEX "product_files_tenant_id_product_id_idx" ON "product_files"("tenant_id", "product_id");

ALTER TABLE "product_files" ADD CONSTRAINT "product_files_tenant_id_product_id_fkey"
    FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_tenant_id_file_id_fkey"
    FOREIGN KEY ("tenant_id", "file_id") REFERENCES "files"("tenant_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
