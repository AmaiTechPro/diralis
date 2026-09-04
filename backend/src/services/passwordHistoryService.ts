import bcrypt from "bcrypt";
import prisma from "../lib/prisma";

const MAX_HISTORY_COUNT = 5;

interface PasswordHistoryRecord {
  id: string;
  hash: string;
  createdAt: Date;
  userId: string;
}

export async function isPasswordReused(userId: string, newPlainText: string): Promise<boolean> {
  const passwordHistoryDelegate = (prisma as any).passwordHistory;
  if (!passwordHistoryDelegate) return false;

  const histories: PasswordHistoryRecord[] = await passwordHistoryDelegate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_COUNT,
  });

  for (const entry of histories) {
    const match = await bcrypt.compare(newPlainText, entry.hash);
    if (match) return true;
  }

  return false;
}

export async function recordPasswordHistory(userId: string, passwordHash: string): Promise<void> {
  const passwordHistoryDelegate = (prisma as any).passwordHistory;
  if (!passwordHistoryDelegate) return;

  await passwordHistoryDelegate.create({
    data: {
      userId,
      hash: passwordHash,
    },
  });

  const allHistories: { id: string }[] = await passwordHistoryDelegate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (allHistories.length > MAX_HISTORY_COUNT) {
    const toDelete = allHistories.slice(MAX_HISTORY_COUNT).map((h: { id: string }) => h.id);
    await passwordHistoryDelegate.deleteMany({
      where: { id: { in: toDelete } },
    });
  }
}

