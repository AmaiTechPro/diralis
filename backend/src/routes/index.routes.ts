import { Router } from "express";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/dashboard", dashboardRoutes);

export default router;

