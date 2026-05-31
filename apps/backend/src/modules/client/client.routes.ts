import { Router } from "express";
import { ClientAuthController } from "./client.controller";
import { ClientTicketsController } from "./client-tickets.controller";
import { clientMiddleware } from "../../middlewares/client.middleware";
import { authLimiter } from "../../lib/rate-limit";

const router = Router();

// rotas públicas
router.post("/register", authLimiter, ClientAuthController.register);
router.post("/login", authLimiter, ClientAuthController.login);

// rotas protegidas
router.use(clientMiddleware);
router.post("/tickets", ClientTicketsController.create);
router.get("/tickets", ClientTicketsController.list);
router.get("/tickets/:id", ClientTicketsController.findById);

export default router;