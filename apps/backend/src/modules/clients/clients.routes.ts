import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", ClientsController.list);
router.get("/:id", ClientsController.findById);
router.put("/:id", ClientsController.update);
router.delete("/:id", ClientsController.delete);

export default router;