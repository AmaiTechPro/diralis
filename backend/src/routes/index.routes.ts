import { Router } from "express";

import dashboardRoutes from "./dashboard.routes";
import authRoutes from "./auth.routes";
import datasetRoutes from "./datasetRoutes";

const router = Router();

router.use("/dashboard", dashboardRoutes);

router.use("/auth", authRoutes);

router.use("/datasets", datasetRoutes);

export default router;

