/*
  Warnings:

  - A unique constraint covering the columns `[code,version]` on the table `SubscriptionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SubscriptionPlan_code_key";

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "SubscriptionPlan_code_idx" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_active_idx" ON "SubscriptionPlan"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_version_key" ON "SubscriptionPlan"("code", "version");
