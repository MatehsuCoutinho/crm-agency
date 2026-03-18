import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AuthService } from "../auth/auth.service";
import { UsersService } from "./users.service";
import { createUserSchema } from "../../lib/schemas";

function isAdmin(req: AuthRequest, res: Response): boolean {
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can perform this action" });
    return false;
  }
  return true;
}

export class UsersController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req, res)) return;

      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      }

      const { name, email, password, role } = parsed.data;
      const user = await AuthService.register(name, email, password, role);

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req, res)) return;

      const users = await UsersService.list();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req, res)) return;

      const { name, email } = req.body;
      const user = await UsersService.update(req.params.id as string, { name, email });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deactivate(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req, res)) return;

      const user = await UsersService.deactivate(req.params.id as string);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}