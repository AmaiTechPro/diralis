import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
{/*import { authenticate } from "../middleware/authMiddleware"; */}

const router = Router();

router.get("/", dashboardController);

export default router;


