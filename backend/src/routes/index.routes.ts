import { Router } from "express";

import dashboardRoutes from "./dashboard.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/dashboard", dashboardRoutes);

router.use("/auth", authRoutes);

export default router;

