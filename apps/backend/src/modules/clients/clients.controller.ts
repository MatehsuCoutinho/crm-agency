import { Request, Response } from "express";
import { ClientsService } from "./clients.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Prisma } from "@prisma/client";

export class ClientsController {
    static async create(req: AuthRequest, res: Response) {
        try {
            const client = await ClientsService.create(
                req.body,
                req.user.userId
            );
            res.status(201).json(client);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async list(req: AuthRequest, res: Response) {
        const clients = await ClientsService.list(req.user);
        res.json(clients);
    }

    static async update(req: Request, res: Response) {
        try {
            const client = await ClientsService.update(req.params.id as string, req.body);
            res.json(client);
        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                res.status(404).json({ message: 'Client not found' });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    }

    static async delete(req: Request<{ id: string }>, res: Response) {
        try {
            await ClientsService.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                res.status(404).json({ message: 'Client not found' });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    }
}