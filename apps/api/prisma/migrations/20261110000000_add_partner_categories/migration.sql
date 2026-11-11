-- CreateTable
CREATE TABLE "partner_categories" (
    "partner_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_categories_pkey" PRIMARY KEY ("partner_id","category_id")
);

-- CreateIndex
CREATE INDEX "partner_categories_category_id_idx" ON "partner_categories"("category_id");

-- AddForeignKey
ALTER TABLE "partner_categories" ADD CONSTRAINT "partner_categories_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_categories" ADD CONSTRAINT "partner_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
