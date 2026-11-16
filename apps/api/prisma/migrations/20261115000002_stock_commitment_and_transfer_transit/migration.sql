ALTER TABLE "stock"
ADD COLUMN "committed_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "stock"
ADD CONSTRAINT "stock_committed_quantity_nonnegative" CHECK ("committed_quantity" >= 0),
ADD CONSTRAINT "stock_available_quantity_nonnegative" CHECK ("quantity" >= "committed_quantity");

ALTER TABLE "stock_transfers"
ADD COLUMN "received_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "shortage_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "reserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lot_serial_number" TEXT,
ADD COLUMN "lot_expiration_date" TIMESTAMP(3),
ADD COLUMN "dispatched_at" TIMESTAMP(3),
ADD COLUMN "received_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3);

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_received_quantity_nonnegative" CHECK ("received_quantity" >= 0),
ADD CONSTRAINT "stock_transfers_shortage_quantity_nonnegative" CHECK ("shortage_quantity" >= 0),
ADD CONSTRAINT "stock_transfers_received_not_above_dispatched" CHECK ("received_quantity" + "shortage_quantity" <= "quantity");
