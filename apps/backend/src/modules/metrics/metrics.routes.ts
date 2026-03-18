import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { MetricsController } from "./metrics.controller";

const router = Router();

router.use(authMiddleware);

router.get("/summary", MetricsController.getSummary);
router.get("/tickets-by-status", MetricsController.getTicketsByStatus);
router.get("/tickets-by-priority", MetricsController.getTicketsByPriority);
router.get("/clients-by-attendant", MetricsController.getClientsByAttendant);

export default router;