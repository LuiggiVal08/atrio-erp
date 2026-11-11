ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" VARCHAR(100);
UPDATE "tenants" SET "slug" = 'demo' WHERE legal_name = 'Demo Company';
UPDATE "tenants" SET "slug" = 'tenant-' || substr(md5(id::text)::text, 1, 8) WHERE "slug" IS NULL;
ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "tenants" ADD UNIQUE ("slug");

CREATE TABLE IF NOT EXISTS "user_access" (
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "role_id" UUID REFERENCES "roles"("id"),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("user_id", "tenant_id")
);
