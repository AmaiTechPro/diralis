import { Router } from "express";

import dashboardRoutes from "./dashboard.routes";
import authRoutes from "./auth.routes";
import datasetRoutes from "./datasetRoutes";
import profileRoutes from "./profileRoutes";
import reportRoutes from "./reportRoutes";


const router = Router();

router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

router.use("/auth", authRoutes);

router.use("/datasets", datasetRoutes);

/*
 * Analytics API
 */
router.use(profileRoutes);

export default router;

