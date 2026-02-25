import { Request, Response } from "express";
import { TicketsService } from "./tickets.service";
import { Prisma } from "@prisma/client";

export class TicketsController {
  static async list(req: Request, res: Response) {
    try {
      const tickets = await TicketsService.list();
      res.json(tickets);
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