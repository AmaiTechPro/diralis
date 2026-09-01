-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "datasetId" TEXT;

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatSession_userId_updatedAt_idx" ON "ChatSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatSession_userId_archivedAt_idx" ON "ChatSession"("userId", "archivedAt");

-- CreateIndex
CREATE INDEX "ChatSession_datasetId_idx" ON "ChatSession"("datasetId");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
