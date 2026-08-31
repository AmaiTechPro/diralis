import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { SubscriptionStatus, BillingInterval } from "@prisma/client";

// =========================
// Get Platform Users
// =========================
export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        provider: true,
        role: true,
        status: true,
        createdAt: true,
        emailVerified: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLogin: true,
        picture: true,
      },
    });

    res.json({
      users,
    });
  } catch (error) {
    console.error("getUsers:", error);
    res.status(500).json({
      message: "Failed to load users",
    });
  }
}

// =========================
// Admin Metrics
// =========================
export async function getAdminMetrics(req: Request, res: Response) {
  try {
    const now = new Date();

    const [
      totalUsers,
      verifiedUsers,
      totalDatasets,
      totalChatSessions,
      totalChatMessages,
      totalSessions,
      activeSessions,
      securityEvents,
      lockedAccounts,
      totalSubscriptionPlans,
      activeSubscriptionPlans,
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      totalWebhookEvents,
      processedWebhookEvents,
      unprocessedWebhookEvents,
      totalBillingProviders,
      enabledBillingProviders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { emailVerified: true },
      }),
      prisma.dataset.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.session.count(),
      prisma.session.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: now },
        },
      }),
      prisma.securityEvent.count(),
      prisma.user.count({
        where: {
          lockedUntil: { gt: now },
        },
      }),
      prisma.subscriptionPlan.count(),
      prisma.subscriptionPlan.count({
        where: { active: true },
      }),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.TRIALING },
      }),
      prisma.payment.count(),
      prisma.payment.count({
        where: { status: "SUCCESS" },
      }),
      prisma.payment.count({
        where: { status: "PENDING" },
      }),
      prisma.payment.count({
        where: { status: "FAILED" },
      }),
      prisma.billingWebhookEvent.count(),
      prisma.billingWebhookEvent.count({
        where: { processed: true },
      }),
      prisma.billingWebhookEvent.count({
        where: { processed: false },
      }),
      prisma.billingProviderConfig.count(),
      prisma.billingProviderConfig.count({
        where: { enabled: true },
      }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
      },
      datasets: {
        total: totalDatasets,
      },
      chat: {
        sessions: totalChatSessions,
        messages: totalChatMessages,
      },
      sessions: {
        total: totalSessions,
        active: activeSessions,
      },
      security: {
        events: securityEvents,
        lockedAccounts,
      },
      billing: {
        subscriptionPlans: {
          total: totalSubscriptionPlans,
          active: activeSubscriptionPlans,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          trialing: trialingSubscriptions,
        },
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          pending: pendingPayments,
          failed: failedPayments,
        },
        webhooks: {
          total: totalWebhookEvents,
          processed: processedWebhookEvents,
          unprocessed: unprocessedWebhookEvents,
        },
        providers: {
          total: totalBillingProviders,
          enabled: enabledBillingProviders,
        },
      },
      totalUsers,
      verifiedUsers,
      totalDatasets,
      securityEvents,
      lockedAccounts,
      activeSessions,
      chatSessions: totalChatSessions,
    });
  } catch (error) {
    console.error("getAdminMetrics:", error);
    res.status(500).json({
      message: "Failed to load admin metrics",
    });
  }
}

// =========================
// Get Platform Subscriptions
// =========================
export async function getAdminSubscriptions(req: Request, res: Response) {
  try {
    const statusQuery = req.query.status as string | undefined;

    const whereClause = statusQuery && statusQuery !== "ALL"
      ? { status: statusQuery as SubscriptionStatus }
      : {};

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            monthlyPrice: true,
            annualPrice: true,
            currency: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            providerReference: true,
          },
        },
      },
    });

    res.json({ subscriptions });
  } catch (error) {
    console.error("getAdminSubscriptions:", error);
    res.status(500).json({ message: "Failed to load subscriptions" });
  }
}

// =========================
// Get Platform Payments
// =========================
export async function getAdminPayments(req: Request, res: Response) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({ payments });
  } catch (error) {
    console.error("getAdminPayments:", error);
    res.status(500).json({ message: "Failed to load payments" });
  }
}

// =========================
// Get Revenue Metrics
// =========================
export async function getAdminRevenueMetrics(req: Request, res: Response) {
  try {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      if (sub.interval === BillingInterval.YEARLY) {
        mrr += Math.round((sub.plan.annualPrice ?? 0) / 12);
      } else {
        mrr += sub.plan.monthlyPrice ?? 0;
      }
    }

    const arr = mrr * 12;

    const totalSuccessfulPayments = await prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      mrr,
      arr,
      activeSubscribers: activeSubscriptions.length,
      totalCollected: totalSuccessfulPayments._sum.amount ?? 0,
      totalTransactions: totalSuccessfulPayments._count.id ?? 0,
      currency: "USD",
    });
  } catch (error) {
    console.error("getAdminRevenueMetrics:", error);
    res.status(500).json({ message: "Failed to load revenue metrics" });
  }
}

// =========================
// Admin Override Subscription
// =========================
export async function adminOverrideSubscription(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;
    const { planId, status, extendDays, cancelAtPeriodEnd } = req.body;

    const existingSub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!existingSub) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    let newCurrentPeriodEnd = existingSub.currentPeriodEnd;
    if (extendDays && typeof extendDays === "number" && extendDays > 0) {
      const baseDate = existingSub.currentPeriodEnd && existingSub.currentPeriodEnd > new Date()
        ? new Date(existingSub.currentPeriodEnd)
        : new Date();
      baseDate.setDate(baseDate.getDate() + extendDays);
      newCurrentPeriodEnd = baseDate;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        planId: planId || existingSub.planId,
        status: status ? (status as SubscriptionStatus) : existingSub.status,
        currentPeriodEnd: newCurrentPeriodEnd,
        cancelAtPeriodEnd: typeof cancelAtPeriodEnd === "boolean" ? cancelAtPeriodEnd : existingSub.cancelAtPeriodEnd,
      },
      include: {
        plan: true,
        user: true,
      },
    });

    await prisma.securityEvent.create({
      data: {
        action: "ROLE_CHANGED",
        userId: existingSub.userId,
        details: `Subscription ${id} overridden by admin ${adminId}: Plan=${updated.plan.code}, Status=${updated.status}`,
      },
    });

    res.json({ subscription: updated });
  } catch (error) {
    console.error("adminOverrideSubscription:", error);
    res.status(500).json({ message: "Failed to override subscription" });
  }
}

// =========================
// Change User Role
// =========================
export async function changeUserRole(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;

    if (adminId === id) {
      return res.status(403).json({
        message: "You cannot change your own role.",
      });
    }

    const { role } = req.body;

    if (!["ADMIN", "USER"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    await prisma.securityEvent.create({
      data: {
        action: "ROLE_CHANGED",
        userId: id,
        details: `Role changed from ${existingUser.role} to ${role} by administrator ${adminId}`,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("changeUserRole:", error);
    res.status(500).json({
      message: "Failed to update role",
    });
  }
}

// =========================
// Suspend / Activate User
// =========================
export async function toggleUserStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;

    if (adminId === id) {
      return res.status(403).json({
        message: "You cannot suspend your own account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    if (newStatus === "SUSPENDED") {
      await prisma.securityEvent.create({
        data: {
          action: "ACCOUNT_DISABLED",
          userId: id,
          details: `Account suspended by administrator ${adminId}`,
        },
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("toggleUserStatus:", error);
    res.status(500).json({
      message: "Failed to update status",
    });
  }
}

// =========================
// Delete User
// =========================
export async function deleteUser(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;

    if (adminId === id) {
      return res.status(403).json({
        message: "You cannot delete your own account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("deleteUser:", error);
    res.status(500).json({
      message: "Failed to delete user",
    });
  }
}

// =========================
// Security Events
// =========================
export async function getSecurityEvents(req: Request, res: Response) {
  try {
    const events = await prisma.securityEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    res.json({
      events,
    });
  } catch (error) {
    console.error("getSecurityEvents:", error);
    res.status(500).json({
      message: "Failed to load security events",
    });
  }
}

// =========================
// Locked Accounts
// =========================
export async function getLockedAccounts(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: {
        lockedUntil: {
          gt: new Date(),
        },
      },
      orderBy: {
        lockedUntil: "asc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        fullName: true,
      },
    });

    res.json({
      users,
    });
  } catch (error) {
    console.error("getLockedAccounts:", error);
    res.status(500).json({
      message: "Failed to load locked accounts",
    });
  }
}


