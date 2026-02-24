import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AuthService } from "../auth/auth.service";

export class UsersController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admin can create users" });
      }

      const { name, email, password, role } = req.body;

      const user = await AuthService.register(
        name,
        email,
        password,
        role
      );

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}