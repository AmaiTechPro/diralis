-- CreateTable
CREATE TABLE "BillingProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "supportedCurrencies" JSONB,
    "supportedIntervals" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingProviderConfig_provider_key" ON "BillingProviderConfig"("provider");

-- CreateIndex
CREATE INDEX "BillingProviderConfig_enabled_idx" ON "BillingProviderConfig"("enabled");

-- CreateIndex
CREATE INDEX "BillingProviderConfig_priority_idx" ON "BillingProviderConfig"("priority");
