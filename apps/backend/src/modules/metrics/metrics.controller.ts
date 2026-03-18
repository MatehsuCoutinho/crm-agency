import { Request, Response } from "express";
import { MetricsService } from "./metrics.service";

export class MetricsController {
    static async getSummary(req: Request, res: Response) {
        try {
            const summary = await MetricsService.getSummary();
            res.json(summary);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getTicketsByStatus(req: Request, res: Response) {
        try {
            const data = await MetricsService.getTicketsByStatus();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getTicketsByPriority(req: Request, res: Response) {
        try {
            const data = await MetricsService.getTicketsByPriority();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getClientsByAttendant(req: Request, res: Response) {
        try {
            const data = await MetricsService.getClientsByAttendant();
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}