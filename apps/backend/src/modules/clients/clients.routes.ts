import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", ClientsController.create);
router.get("/", ClientsController.list);
router.put("/:id", ClientsController.update);
router.delete("/:id", ClientsController.delete);

export default router;