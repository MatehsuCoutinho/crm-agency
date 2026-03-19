import { Request, Response } from "express";
import { ClientAuthService } from "./client.service";
import { registerClientSchema, loginSchema } from "../../lib/schemas";

export class ClientAuthController {
    static async register(req: Request, res: Response) {
        try {
            const parsed = registerClientSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
            }

            const { name, email, password, phone } = parsed.data;
            const client = await ClientAuthService.register(name, email, password, phone);

            res.status(201).json({
                message: "Client registered successfully",
                client
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
            const data = await ClientAuthService.login(email, password);

            res.json({
                message: "Login successful",
                ...data
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}