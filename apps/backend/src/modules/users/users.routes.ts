import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { UsersController } from "./users.controller";
import { writeLimiter } from "../../lib/rate-limit";

const router = Router();

router.use(authMiddleware);

router.post("/", writeLimiter, UsersController.create);
router.get("/", UsersController.list);
router.put("/:id", writeLimiter, UsersController.update);
router.patch("/:id/deactivate", writeLimiter, UsersController.deactivate);

export default router;