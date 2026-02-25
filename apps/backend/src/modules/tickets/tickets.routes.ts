import { Router } from "express";
import { TicketsController } from "./tickets.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", TicketsController.list);
router.get("/grouped", TicketsController.listGrouped);
router.put("/:id/status", TicketsController.updateStatus);
router.get("/:id/messages", TicketsController.getMessages);

export default router;