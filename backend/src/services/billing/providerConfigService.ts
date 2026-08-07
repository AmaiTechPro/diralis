import { BillingProvider } from "@prisma/client";
import prisma from "../../lib/prisma";

export async function getEnabledBillingProviders() {
  return prisma.billingProviderConfig.findMany({
    where: {
      enabled: true,
    },
    orderBy: [
      {
        priority: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

export async function getPrimaryBillingProvider() {
  const provider = await prisma.billingProviderConfig.findFirst({
    where: {
      enabled: true,
    },
    orderBy: [
      {
        priority: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  if (!provider) {
    throw new Error(
      "No billing provider is currently enabled."
    );
  }

  return provider;
}

export async function getBillingProviderConfig(
  provider: BillingProvider
) {
  return prisma.billingProviderConfig.findUnique({
    where: {
      provider,
    },
  });
}

export async function isBillingProviderEnabled(
  provider: BillingProvider
): Promise<boolean> {
  const config = await prisma.billingProviderConfig.findUnique({
    where: {
      provider,
    },
  });

  return config?.enabled === true;
}

