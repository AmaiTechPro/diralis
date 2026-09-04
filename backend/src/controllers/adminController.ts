import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { SubscriptionStatus, BillingInterval, SecurityAction } from "@prisma/client";

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
        twoFactorEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        lastLogin: true,
        picture: true,
        _count: {
          select: {
            securityEvents: true,
          },
        },
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("getUsers:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
}

// =========================
// Admin Core Metrics
// =========================
export async function getAdminMetrics(req: Request, res: Response) {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
      recentFailedLogins,
      totalPasskeys,
      usersWith2FA,
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
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.dataset.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.session.count(),
      prisma.session.count({
        where: { revokedAt: null, expiresAt: { gt: now } },
      }),
      prisma.securityEvent.count(),
      prisma.user.count({ where: { lockedUntil: { gt: now } } }),
      prisma.securityEvent.count({
        where: {
          action: "FAILED_LOGIN",
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.passkeyCredential.count(),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.subscriptionPlan.count(),
      prisma.subscriptionPlan.count({ where: { active: true } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      prisma.subscription.count({ where: { status: SubscriptionStatus.TRIALING } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.billingWebhookEvent.count(),
      prisma.billingWebhookEvent.count({ where: { processed: true } }),
      prisma.billingWebhookEvent.count({ where: { processed: false } }),
      prisma.billingProviderConfig.count(),
      prisma.billingProviderConfig.count({ where: { enabled: true } }),
    ]);

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        twoFactorAdoption: usersWith2FA,
      },
      datasets: { total: totalDatasets },
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
        recentFailedLogins,
        totalPasskeys,
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
    res.status(500).json({ message: "Failed to load admin metrics" });
  }
}

// =========================
// Advanced Security Telemetry Metrics
// =========================
export async function getSecurityTelemetryMetrics(_req: Request, res: Response) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalPasskeys,
      failedLogins24h,
      lockedAccounts,
      eventsByAction,
      topCountries,
    ] = await Promise.all([
      prisma.passkeyCredential.count(),
      prisma.securityEvent.count({
        where: {
          action: "FAILED_LOGIN",
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.user.count({
        where: { lockedUntil: { gt: new Date() } },
      }),
      prisma.securityEvent.groupBy({
        by: ["action"],
        _count: { action: true },
        where: { createdAt: { gte: twentyFourHoursAgo } },
      }),
      prisma.securityEvent.groupBy({
        by: ["country"],
        _count: { country: true },
        where: { country: { not: null } },
        orderBy: { _count: { country: "desc" } },
        take: 5,
      }),
    ]);

    res.json({
      totalPasskeys,
      failedLogins24h,
      lockedAccounts,
      eventsByAction: eventsByAction.map((e: { action: SecurityAction; _count: { action: number } }) => ({
        action: e.action,
        count: e._count.action,
      })),
      topCountries: topCountries.map((c: { country: string | null; _count: { country: number } }) => ({
        country: c.country || "Unknown",
        count: c._count.country,
      })),
    });
  } catch (error) {
    console.error("getSecurityTelemetryMetrics:", error);
    res.status(500).json({ message: "Failed to load security telemetry metrics" });
  }
}

// =========================
// Security Audit Logs (Paginated, Filterable)
// =========================
export async function getSecurityEvents(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
    const skip = (page - 1) * limit;

    const action = req.query.action as string | undefined;
    const search = req.query.search as string | undefined;
    const country = req.query.country as string | undefined;

    const where: any = {};

    if (action && action !== "ALL") {
      where.action = action as SecurityAction;
    }

    if (country && country !== "ALL") {
      where.country = country;
    }

    if (search) {
      where.OR = [
        { ipAddress: { contains: search, mode: "insensitive" } },
        { device: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
              picture: true,
              status: true,
            },
          },
        },
      }),
      prisma.securityEvent.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getSecurityEvents:", error);
    res.status(500).json({ message: "Failed to load security events" });
  }
}

// =========================
// Unlock Locked Account
// =========================
export async function unlockUserAccount(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });

    await prisma.securityEvent.create({
      data: {
        action: "PASSWORD_CHANGED",
        userId: id,
        details: `Account unlocked and login attempt counter reset by administrator ${adminId}`,
      },
    });

    res.json({ message: "Account successfully unlocked", user: updatedUser });
  } catch (error) {
    console.error("unlockUserAccount:", error);
    res.status(500).json({ message: "Failed to unlock account" });
  }
}

// =========================
// Get Passkeys for a User (Admin View)
// =========================
export async function getUserPasskeysAdmin(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;

    const passkeys = await prisma.passkeyCredential.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        deviceType: true,
        backedUp: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    res.json({ passkeys });
  } catch (error) {
    console.error("getUserPasskeysAdmin:", error);
    res.status(500).json({ message: "Failed to load user passkeys" });
  }
}

// =========================
// Revoke User Passkey (Admin Action)
// =========================
export async function revokeUserPasskeyAdmin(req: Request, res: Response) {
  try {
    const passkeyId = req.params.passkeyId as string;
    const adminId = res.locals.user.id;

    const passkey = await prisma.passkeyCredential.findUnique({
      where: { id: passkeyId },
    });

    if (!passkey) {
      return res.status(404).json({ message: "Passkey not found" });
    }

    await prisma.passkeyCredential.delete({
      where: { id: passkeyId },
    });

    await prisma.securityEvent.create({
      data: {
        action: "WEBAUTHN_REVOKED",
        userId: passkey.userId,
        details: `Passkey "${passkey.name}" revoked by administrator ${adminId}`,
      },
    });

    res.json({ message: "Passkey successfully revoked" });
  } catch (error) {
    console.error("revokeUserPasskeyAdmin:", error);
    res.status(500).json({ message: "Failed to revoke passkey" });
  }
}

// =========================
// Locked Accounts
// =========================
export async function getLockedAccounts(_req: Request, res: Response) {
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

    res.json({ users });
  } catch (error) {
    console.error("getLockedAccounts:", error);
    res.status(500).json({ message: "Failed to load locked accounts" });
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
      return res.status(403).json({ message: "You cannot change your own role." });
    }

    const { role } = req.body;
    if (!["ADMIN", "USER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
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
    res.status(500).json({ message: "Failed to update role" });
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
      return res.status(403).json({ message: "You cannot suspend your own account." });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    res.status(500).json({ message: "Failed to update status" });
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
      return res.status(403).json({ message: "You cannot delete your own account." });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser:", error);
    res.status(500).json({ message: "Failed to delete user" });
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
          select: { id: true, fullName: true, username: true, email: true },
        },
        plan: {
          select: { id: true, code: true, name: true, monthlyPrice: true, annualPrice: true, currency: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, amount: true, status: true, paidAt: true, providerReference: true },
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
export async function getAdminPayments(_req: Request, res: Response) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, fullName: true, username: true, email: true },
        },
        subscription: {
          include: {
            plan: {
              select: { id: true, code: true, name: true },
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
export async function getAdminRevenueMetrics(_req: Request, res: Response) {
  try {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
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
      include: { plan: true, user: true },
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


export async function getSecurityMetrics(req: Request, res: Response) {
  try {
    const totalEvents = await prisma.securityEvent.count();
    
    const failedLogins = await prisma.securityEvent.count({
      where: { action: "FAILED_LOGIN" },
    });

    const twoFactorUsers = await prisma.user.count({
      where: { twoFactorEnabled: true },
    });

    const lockedUsers = await prisma.user.count({
      where: { lockedUntil: { gt: new Date() } },
    });

    const activePasskeys = await prisma.passkeyCredential.count();

    res.json({
      totalEvents,
      failedLogins,
      twoFactorUsers,
      lockedUsers,
      activePasskeys,
    });
  } catch (error) {
    console.error("getSecurityMetrics error:", error);
    res.status(500).json({ error: "Failed to load security metrics." });
  }
}


