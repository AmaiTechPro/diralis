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

      },

    });


    res.json({

      users,

    });


  } catch (error) {

    console.error(error);

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

    const [

      totalUsers,

      totalDatasets,

    ] = await Promise.all([

      prisma.user.count(),

      prisma.dataset.count(),

    ]);


    res.json({

      totalUsers,

      totalDatasets,

      totalReports: 0,

      totalAIRequests: 0,

    });


  } catch (error) {

    console.error(error);

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

    message:
      "You cannot change your own role.",

  });

}

    const { role } = req.body;

    const user = await prisma.user.update({

      where: {
        id,
      },

      data: {
        role,
      },

    });

    res.json(user);

  } catch (error) {

    console.error(error);

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

    message:
      "You cannot suspend your own account.",

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

    const updatedUser = await prisma.user.update({

      where: {
        id,
      },

      data: {

        status:

          user.status === "ACTIVE"

            ? "SUSPENDED"

            : "ACTIVE",

      },

    });

    res.json(updatedUser);

  } catch (error) {

    console.error(error);

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

    message:
      "You cannot delete your own account.",

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

    console.error(error);

    res.status(500).json({

      message: "Failed to delete user",

    });

  }

}

