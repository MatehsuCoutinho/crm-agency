import { Response } from "express";
import { ClientsService } from "./clients.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Prisma } from "@prisma/client";

function handlePrismaError(error: unknown, res: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Client not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Client already exists" });
    }
  }
  return res.status(500).json({ message: "Internal server error" });
}

export class ClientsController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const client = await ClientsService.create(req.body, req.user!.userId);
      res.status(201).json(client);
    } catch (error) {
      handlePrismaError(error, res);
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

      const result = await ClientsService.list(req.user!, page, limit);
      res.json(result);
    } catch (error) {
      handlePrismaError(error, res);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const client = await ClientsService.update(req.params.id as string, req.body);
      res.json(client);
    } catch (error) {
      handlePrismaError(error, res);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      await ClientsService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      handlePrismaError(error, res);
    }
  }
}