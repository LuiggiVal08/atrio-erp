ALTER TABLE "product_brands"
    ADD COLUMN "logo_file_id" UUID;

CREATE UNIQUE INDEX "product_brands_tenant_id_logo_file_id_key"
    ON "product_brands"("tenant_id", "logo_file_id");

ALTER TABLE "product_brands"
    ADD CONSTRAINT "product_brands_tenant_id_logo_file_id_fkey"
    FOREIGN KEY ("tenant_id", "logo_file_id")
    REFERENCES "files"("tenant_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "code", "name", "module", "action")
VALUES
    (gen_random_uuid(), 'inventory:brand:create', 'Create product brand', 'inventory', 'create'),
    (gen_random_uuid(), 'inventory:brand:read', 'View product brands', 'inventory', 'read'),
    (gen_random_uuid(), 'inventory:brand:update', 'Edit product brand', 'inventory', 'update'),
    (gen_random_uuid(), 'inventory:brand:delete', 'Deactivate product brand', 'inventory', 'delete')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p
  ON p."code" IN (
    'inventory:brand:create',
    'inventory:brand:read',
    'inventory:brand:update',
    'inventory:brand:delete'
  )
WHERE r."name" = 'Admin'
  AND r."is_system" = true
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
