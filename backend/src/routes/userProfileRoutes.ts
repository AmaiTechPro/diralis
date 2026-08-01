import { Router } from "express";

import {
  getUserProfile,
} from "../controllers/userProfileController";

import {
  authenticate,
} from "../middleware/authMiddleware";


const router = Router();


router.get(
  "/",
  authenticate,
  getUserProfile
);


export default router;

