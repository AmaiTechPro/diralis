import { Router } from "express";
import { overallInsightsController } from "../controllers/overallInsightsController";

const router = Router();

router.get("/", overallInsightsController);

export default router;


