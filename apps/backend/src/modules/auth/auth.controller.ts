import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const user = await AuthService.register(name, email, password);

      res.status(201).json({message:"User registered successfully", user: {name: user.name, email: user.email}});
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const data = await AuthService.login(email, password);

      res.json({message: "Login successful", user: {name: data.user.name, email: data.user.email}, token: data.token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}