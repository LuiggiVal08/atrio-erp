-- CreateTable
CREATE TABLE "pos_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cash_register_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "opening_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closing_balance" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'open',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_sessions_tenant_id_status_idx" ON "pos_sessions"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
