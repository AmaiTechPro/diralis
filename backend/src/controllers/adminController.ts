import { Request, Response } from "express";
import prisma from "../lib/prisma";

// =========================
// Get Platform Users
// =========================

export async function getUsers(
  req: Request,
  res: Response
) {
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

export async function getAdminMetrics(
  req: Request,
  res: Response
) {
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
        where: {
          emailVerified: true,
        },
      }),

      prisma.dataset.count(),

      prisma.chatSession.count(),

      prisma.chatMessage.count(),

      prisma.session.count(),

      prisma.session.count({
        where: {
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
      }),

      prisma.securityEvent.count(),

      prisma.user.count({
        where: {
          lockedUntil: {
            gt: now,
          },
        },
      }),

      prisma.subscriptionPlan.count(),

      prisma.subscriptionPlan.count({
        where: {
          active: true,
        },
      }),

      prisma.subscription.count(),

      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),

      prisma.subscription.count({
        where: {
          status: "TRIALING",
        },
      }),

      prisma.payment.count(),

      prisma.payment.count({
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.payment.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.payment.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.billingWebhookEvent.count(),

      prisma.billingWebhookEvent.count({
        where: {
          processed: true,
        },
      }),

      prisma.billingWebhookEvent.count({
        where: {
          processed: false,
        },
      }),

      prisma.billingProviderConfig.count(),

      prisma.billingProviderConfig.count({
        where: {
          enabled: true,
        },
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

      // Backwards-compatible fields
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
// Change User Role
// =========================

export async function changeUserRole(
  req: Request,
  res: Response
) {
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
      where: {
        id,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const user = await prisma.user.update({
      where: {
        id,
      },

      data: {
        role,
      },
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

export async function toggleUserStatus(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;

    if (adminId === id) {
      return res.status(403).json({
        message: "You cannot suspend your own account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newStatus =
      user.status === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE";

    const updatedUser = await prisma.user.update({
      where: {
        id,
      },

      data: {
        status: newStatus,
      },
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

export async function deleteUser(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string;
    const adminId = res.locals.user.id;

    if (adminId === id) {
      return res.status(403).json({
        message: "You cannot delete your own account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
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

export async function getSecurityEvents(
  req: Request,
  res: Response
) {
  try {
    const events =
      await prisma.securityEvent.findMany({
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

export async function getLockedAccounts(
  req: Request,
  res: Response
) {
  try {
    const users =
      await prisma.user.findMany({
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

