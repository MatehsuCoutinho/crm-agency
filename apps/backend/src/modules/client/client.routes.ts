import { Router } from "express";
import { ClientAuthController } from "./client.controller";
import rateLimit from "express-rate-limit";

const clientRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

const router = Router();

router.post("/register", clientRateLimit, ClientAuthController.register);
router.post("/login", clientRateLimit, ClientAuthController.login);

export default router;