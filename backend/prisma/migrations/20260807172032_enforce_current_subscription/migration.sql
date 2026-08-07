/*
  Warnings:

  - A unique constraint covering the columns `[currentKey]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "currentKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_currentKey_key" ON "Subscription"("currentKey");
