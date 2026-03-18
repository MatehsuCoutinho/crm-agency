import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { UsersController } from "./users.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", UsersController.create);
router.get("/", UsersController.list);
router.put("/:id", UsersController.update);
router.patch("/:id/deactivate", UsersController.deactivate);

export default router;