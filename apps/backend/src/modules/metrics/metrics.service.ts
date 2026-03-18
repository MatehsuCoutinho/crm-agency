import { prisma } from "../../lib/prisma";

export class MetricsService {
    static async getTicketsByStatus() {
        return prisma.ticket.groupBy({
            by: ["status"],
            _count: { status: true }
        });
    }

    static async getTicketsByPriority() {
        return prisma.ticket.groupBy({
            by: ["priority"],
            _count: { priority: true }
        });
    }

    static async getClientsByAttendant() {
        return prisma.user.findMany({
            where: { role: "ATTENDANT", active: true },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { clients: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }

    static async getAverageResolutionTime() {
        const resolvedTickets = await prisma.ticket.findMany({
            where: { status: "DONE" },
            select: {
                createdAt: true,
                updatedAt: true
            }
        });

        if (resolvedTickets.length === 0) {
            return { averageHours: 0, totalResolved: 0 };
        }

        const totalMs = resolvedTickets.reduce((acc, ticket) => {
            return acc + (ticket.updatedAt.getTime() - ticket.createdAt.getTime());
        }, 0);

        const averageHours = totalMs / resolvedTickets.length / 1000 / 60 / 60;

        return {
            averageHours: Math.round(averageHours * 100) / 100,
            totalResolved: resolvedTickets.length
        };
    }

    static async getSummary() {
        const [ticketsByStatus, ticketsByPriority, clientsByAttendant, resolutionTime] =
            await Promise.all([
                MetricsService.getTicketsByStatus(),
                MetricsService.getTicketsByPriority(),
                MetricsService.getClientsByAttendant(),
                MetricsService.getAverageResolutionTime()
            ]);

        return {
            ticketsByStatus,
            ticketsByPriority,
            clientsByAttendant,
            resolutionTime
        };
    }
}