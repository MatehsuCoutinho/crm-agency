import { Response } from "express";
import { ClientRequest } from "../../middlewares/client.middleware";
import { ClientTicketsService } from "./client-tickets.service";
import { createTicketSchema } from "../../lib/schemas";

export class ClientTicketsController {
    static async create(req: ClientRequest, res: Response) {
        try {
            const parsed = createTicketSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
            }

            const { title, description } = parsed.data;
            const ticket = await ClientTicketsService.create(
                req.client!.clientId,
                title,
                description
            );

            res.status(201).json(ticket);
        } catch (error: any) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async list(req: ClientRequest, res: Response) {
        try {
            const tickets = await ClientTicketsService.list(req.client!.clientId);
            res.json(tickets);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async findById(req: ClientRequest, res: Response) {
        try {
            const ticket = await ClientTicketsService.findById(
                req.client!.clientId,
                req.params.id as string
            );
            res.json(ticket);
        } catch (error: any) {
            if (error.message === "Ticket not found") {
                return res.status(404).json({ message: "Ticket not found" });
            }
            res.status(500).json({ message: "Internal server error" });
        }
    }
}