import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const user = await AuthService.register(name, email, password);

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const data = await AuthService.login(email, password);

      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}