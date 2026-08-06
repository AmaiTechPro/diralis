import { Router } from "express";

import { adminMiddleware } from "../middleware/adminMiddleware";

import {
 getUsers,
 getAdminMetrics,
 changeUserRole,
 toggleUserStatus,
 deleteUser,
 getSecurityEvents,
 getLockedAccounts,
} from "../controllers/adminController";


const router = Router();


// All routes below require ADMIN access

router.get(
  "/users",
  adminMiddleware,
  getUsers
);


router.get(
  "/metrics",
  adminMiddleware,
  getAdminMetrics
);


router.patch(
  "/users/:id/role",
  adminMiddleware,
  changeUserRole
);

router.patch(
  "/users/:id/status",
  adminMiddleware,
  toggleUserStatus
);

router.delete(
  "/users/:id",
  adminMiddleware,
  deleteUser
);

router.get(
  "/security-events",
  adminMiddleware,
  getSecurityEvents
);


router.get(
  "/locked-accounts",
  adminMiddleware,
  getLockedAccounts
);

export default router;

