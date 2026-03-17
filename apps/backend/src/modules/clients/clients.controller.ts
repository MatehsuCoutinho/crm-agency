import { Response } from "express";
import { ClientsService } from "./clients.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Prisma } from "@prisma/client";

function handlePrismaError(error: any, res: Response) {
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
      const search = req.query.search as string | undefined;

      const result = await ClientsService.list(req.user!, page, limit, search);
      res.json(result);
    } catch (error) {
      handlePrismaError(error, res);
    }
  }

  static async findById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verifica se é um array ou undefined
      if (Array.isArray(id) || !id) {
        return res.status(400).json({ message: "Invalid client ID" });
      }

      const client = await ClientsService.findById(id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
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