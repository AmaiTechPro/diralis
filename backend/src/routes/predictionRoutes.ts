import { Router }
from "express";

import { analyzePrediction }
from "../controllers/predictionController";


const router =
  Router();


router.post(
  "/analyze",
  analyzePrediction
);


export default router;

