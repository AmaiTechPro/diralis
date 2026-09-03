import prisma from "../lib/prisma";

export interface CanonicalDataResult {
  sourceName: string;
  rows: Record<string, any>[];
  totalRecords: number;
}

/**
 * Retrieves and normalizes stored canonical transactions into tabular rows
 * compatible with profileDataset and the deterministic intelligence engine.
 */
export async function getCanonicalDatasetRows(userId: string): Promise<CanonicalDataResult | null> {
  // Check for active connection
  const connection = await prisma.integrationConnection.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      providerId: true,
      createdAt: true,
    },
  });

  const txCount = await prisma.canonicalTransaction.count({
    where: { userId },
  });

  if (txCount === 0) {
    return null;
  }

  // Fetch up to 10,000 canonical transactions for profiling
  const transactions = await prisma.canonicalTransaction.findMany({
    where: { userId },
    orderBy: { transactionDate: "desc" },
    take: 10000,
  });

  // Map into flat tabular records with standard business column names
  const rows = transactions.map((tx) => ({
    "Transaction ID": tx.externalId || tx.id,
    "Date": tx.transactionDate ? tx.transactionDate.toISOString().split("T")[0] : "N/A",
    "Total Amount": tx.totalAmount,
    "Subtotal": tx.subtotal,
    "Tax": tx.tax,
    "Discount": tx.discount,
    "Currency": tx.currency || "USD",
  }));

  const providerName = connection?.providerId === "shopify_pos" ? "Shopify Store (Live Sync)" : "Connected POS Data";

  return {
    sourceName: providerName,
    rows,
    totalRecords: txCount,
  };
}


