/*
  Warnings:

  - Added the required column `updated_at` to the `purchase_returns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "purchase_returns" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
