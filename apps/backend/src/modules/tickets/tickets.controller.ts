import { Request, Response } from "express";
import { TicketsService } from "./tickets.service";
import { Prisma, TicketStatus } from "@prisma/client";

const VALID_STATUSES = Object.values(TicketStatus);

export class TicketsController {
  static async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

      const result = await TicketsService.list(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async listGrouped(req: Request, res: Response) {
    try {
      const data = await TicketsService.listGrouped();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async updateStatus(req: Request<{ id: string }>, res: Response) {
    try {
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }

      if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({
          message: `Invalid status. Valid values are: ${VALID_STATUSES.join(", ")}`
        });
        return;
      }

      const ticket = await TicketsService.updateStatus(req.params.id, status);
      res.json(ticket);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ message: "Ticket not found" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  static async getMessages(req: Request<{ id: string }>, res: Response) {
    try {
      const messages = await TicketsService.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ message: "Ticket not found" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}