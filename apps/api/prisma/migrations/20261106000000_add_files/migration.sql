CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "original_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" CHAR(64) NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "files_size_bytes_check" CHECK ("size_bytes" >= 0)
);

CREATE UNIQUE INDEX "files_storage_key_key" ON "files"("storage_key");
CREATE INDEX "files_tenant_id_deleted_at_created_at_idx" ON "files"("tenant_id", "deleted_at", "created_at" DESC);
CREATE INDEX "files_uploaded_by_id_idx" ON "files"("uploaded_by_id");

ALTER TABLE "files" ADD CONSTRAINT "files_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
