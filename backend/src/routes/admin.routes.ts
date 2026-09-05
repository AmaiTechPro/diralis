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
  getAdminSubscriptions,
  getAdminPayments,
  getAdminRevenueMetrics,
  adminOverrideSubscription,
  getSecurityMetrics,
  getAdminDatasets,
  getTenantDatasetsGrouped,
  adminDeleteDataset,
  adminPurgeTenantDatasets,
} from "../controllers/adminController";

const router = Router();

// ==========================================
// User & Account Administration
// ==========================================
router.get("/users", adminMiddleware, getUsers);
router.patch("/users/:id/role", adminMiddleware, changeUserRole);
router.patch("/users/:id/status", adminMiddleware, toggleUserStatus);
router.delete("/users/:id", adminMiddleware, deleteUser);
router.get("/locked-accounts", adminMiddleware, getLockedAccounts);

// ==========================================
// Global Metrics & Telemetry
// ==========================================
router.get("/metrics", adminMiddleware, getAdminMetrics);
router.get("/security/metrics", adminMiddleware, getSecurityMetrics);
router.get("/security-events", adminMiddleware, getSecurityEvents);
router.get("/security/events", adminMiddleware, getSecurityEvents);

// ==========================================
// Subscription & Revenue Operations
// ==========================================
router.get("/subscriptions", adminMiddleware, getAdminSubscriptions);
router.get("/payments", adminMiddleware, getAdminPayments);
router.get("/revenue", adminMiddleware, getAdminRevenueMetrics);
router.patch("/subscriptions/:id/override", adminMiddleware, adminOverrideSubscription);

// ==========================================
// Enterprise Tenant & Dataset Management (CRUD)
// ==========================================
// 1. Get all datasets with tenant details (searchable)
router.get("/datasets", adminMiddleware, getAdminDatasets);

// 2. Get datasets grouped by business / tenant
router.get("/datasets/tenants", adminMiddleware, getTenantDatasetsGrouped);

// 3. Admin single dataset deletion (customer support assistance)
router.delete("/datasets/:datasetId", adminMiddleware, adminDeleteDataset);

// 4. 1-Click tenant data purge (bulk delete all datasets for a business)
router.delete("/tenants/:tenantId/datasets", adminMiddleware, adminPurgeTenantDatasets);

export default router;



