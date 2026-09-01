import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { getInsightsFeed, dismissInsight } from "../controllers/copilotController";

const router = Router();

router.get("/feed/:datasetId", authenticate, getInsightsFeed);
router.post("/feed/:insightId/dismiss", authenticate, dismissInsight);

export default router;

