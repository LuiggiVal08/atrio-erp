ALTER TABLE "stock_movements"
ADD COLUMN "operation_key" TEXT;

CREATE UNIQUE INDEX "stock_movements_operation_key_key" ON "stock_movements"("operation_key");

ALTER TABLE "stock_transfers"
ADD COLUMN "lot_number" TEXT;
