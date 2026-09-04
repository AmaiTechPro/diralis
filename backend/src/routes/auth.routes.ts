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
  getSecurityTelemetryMetrics,
  unlockUserAccount,
  getUserPasskeysAdmin,
  revokeUserPasskeyAdmin,
  getAdminSubscriptions,
  getAdminPayments,
  getAdminRevenueMetrics,
  adminOverrideSubscription,
} from "../controllers/adminController";

const router = Router();

// All routes require ADMIN access
router.get("/users", adminMiddleware, getUsers);
router.get("/metrics", adminMiddleware, getAdminMetrics);
router.patch("/users/:id/role", adminMiddleware, changeUserRole);
router.patch("/users/:id/status", adminMiddleware, toggleUserStatus);
router.delete("/users/:id", adminMiddleware, deleteUser);

// Security Telemetry & Administrative Response
router.get("/security/metrics", adminMiddleware, getSecurityTelemetryMetrics);
router.get("/security/events", adminMiddleware, getSecurityEvents);
router.get("/security-events", adminMiddleware, getSecurityEvents); // backwards-compatibility alias
router.get("/locked-accounts", adminMiddleware, getLockedAccounts);
router.post("/users/:id/unlock", adminMiddleware, unlockUserAccount);
router.get("/users/:userId/passkeys", adminMiddleware, getUserPasskeysAdmin);
router.delete("/passkeys/:passkeyId", adminMiddleware, revokeUserPasskeyAdmin);

// Subscription & Revenue Management
router.get("/subscriptions", adminMiddleware, getAdminSubscriptions);
router.get("/payments", adminMiddleware, getAdminPayments);
router.get("/revenue", adminMiddleware, getAdminRevenueMetrics);
router.patch("/subscriptions/:id/override", adminMiddleware, adminOverrideSubscription);

export default router;




