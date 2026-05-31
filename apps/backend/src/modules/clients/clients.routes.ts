import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { writeLimiter } from "../../lib/rate-limit";

const router = Router();

router.use(authMiddleware);

router.post("/", writeLimiter, ClientsController.create);
router.get("/", ClientsController.list);
router.get("/:id", ClientsController.findById);
router.put("/:id", writeLimiter, ClientsController.update);
router.patch("/:id/status", writeLimiter, ClientsController.updateStatus);
router.delete("/:id", writeLimiter, ClientsController.delete);

export default router;