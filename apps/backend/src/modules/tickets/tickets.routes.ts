import { Router } from "express";
import { TicketsController } from "./tickets.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { writeLimiter } from "../../lib/rate-limit";

const router = Router();

router.use(authMiddleware);

router.get("/", TicketsController.list);
router.get("/grouped", TicketsController.listGrouped);
router.put("/:id/status", writeLimiter, TicketsController.updateStatus);
router.put("/:id/priority", writeLimiter, TicketsController.updatePriority);
router.put("/:id/reassign", writeLimiter, TicketsController.reassign);
router.get("/:id/messages", TicketsController.getMessages);

export default router;