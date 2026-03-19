import { Router } from "express";
import { ClientAuthController } from "./client.controller";
import { ClientTicketsController } from "./client-tickets.controller";
import { clientMiddleware } from "../../middlewares/client.middleware";
import rateLimit from "express-rate-limit";

const clientRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

const router = Router();

// rotas públicas
router.post("/register", clientRateLimit, ClientAuthController.register);
router.post("/login", clientRateLimit, ClientAuthController.login);

// rotas protegidas
router.use(clientMiddleware);
router.post("/tickets", ClientTicketsController.create);
router.get("/tickets", ClientTicketsController.list);
router.get("/tickets/:id", ClientTicketsController.findById);

export default router;