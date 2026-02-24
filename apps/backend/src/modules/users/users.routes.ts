import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { UsersController } from "./users.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", UsersController.create);

export default router;