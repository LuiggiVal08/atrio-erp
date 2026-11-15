-- AlterTable: branch location and manager
ALTER TABLE "branches" ADD COLUMN "city" TEXT;
ALTER TABLE "branches" ADD COLUMN "state" TEXT;
ALTER TABLE "branches" ADD COLUMN "manager_employee_id" UUID;
