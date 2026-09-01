-- CreateTable
CREATE TABLE "CopilotInsight" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "observedValue" DOUBLE PRECISION NOT NULL,
    "expectedValue" DOUBLE PRECISION,
    "deltaPercentage" DOUBLE PRECISION,
    "narrative" TEXT NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "mapVersion" INTEGER NOT NULL DEFAULT 1,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopilotInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CopilotInsight_userId_datasetId_dismissedAt_idx" ON "CopilotInsight"("userId", "datasetId", "dismissedAt");

-- CreateIndex
CREATE INDEX "CopilotInsight_datasetId_createdAt_idx" ON "CopilotInsight"("datasetId", "createdAt");

-- AddForeignKey
ALTER TABLE "CopilotInsight" ADD CONSTRAINT "CopilotInsight_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotInsight" ADD CONSTRAINT "CopilotInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
