import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, registerAdminSchema } from "../../lib/schemas";

export class AuthController {
  static async registerAdmin(req: Request, res: Response) {
    try {
      const parsed = registerAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      }

      const { name, email, password } = parsed.data;
      const user = await AuthService.registerAdmin(name, email, password);

      res.status(201).json({
        message: "Admin registered successfully",
        user: { name: user.name, email: user.email }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      }

      const { email, password } = parsed.data;
      const data = await AuthService.login(email, password);

      res.json({
        message: "Login successful",
        user: { name: data.user.name, email: data.user.email },
        token: data.token
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}