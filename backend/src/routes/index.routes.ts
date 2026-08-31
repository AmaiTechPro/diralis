import { Router } from "express";
import dashboardRoutes from "./dashboard.routes";
import authRoutes from "./auth.routes";
import datasetRoutes from "./datasetRoutes";
import profileRoutes from "./profileRoutes";
import reportRoutes from "./reportRoutes";
import adminRoutes from "./admin.routes";
import billingRoutes from "./billingRoutes";
import {
  authLimiter,
  uploadLimiter,
  generalLimiter,
} from "../middleware/rateLimiter";

const router = Router();

// Apply general API rate limiting to regular traffic
router.use(generalLimiter);

// Specialized rate limiters on sensitive endpoints
router.use("/auth", authLimiter, authRoutes);
router.use("/datasets", uploadLimiter, datasetRoutes);

// General resource routes
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/admin", adminRoutes);
router.use("/billing", billingRoutes);

/*
 * Analytics API & Chat
 */
router.use(profileRoutes);

export default router;


