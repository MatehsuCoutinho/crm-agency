import { prisma } from "../../lib/prisma";

export class ClientTicketsService {
    static async create(clientId: string, title: string, description: string) {
        return prisma.ticket.create({
            data: {
                title,
                description,
                clientId
            }
        });
    }

    static async list(clientId: string) {
        return prisma.ticket.findMany({
            where: { clientId },
            orderBy: { createdAt: "desc" }
        });
    }

    static async findById(clientId: string, ticketId: string) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                messages: {
                    include: {
                        sender: { select: { id: true, name: true } }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!ticket || ticket.clientId !== clientId) {
            throw new Error("Ticket not found");
        }

        return ticket;
    }
}