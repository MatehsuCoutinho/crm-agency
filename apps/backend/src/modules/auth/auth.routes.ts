import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authLimiter } from "../../lib/rate-limit";

const router = Router();

router.post("/register", authLimiter, AuthController.registerAdmin);
router.post("/login", authLimiter, AuthController.login);

export default router;