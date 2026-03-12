import { Router } from "express";
import { AuthController } from "./auth.controller";
import rateLimit from "express-rate-limit";

const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 tentativas por IP
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

const router = Router();

router.post("/login", loginRateLimit, AuthController.login);

export default router;