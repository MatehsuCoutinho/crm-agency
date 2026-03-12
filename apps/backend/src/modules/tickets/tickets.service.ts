import { prisma } from "../../lib/prisma";
import { TicketStatus } from "@prisma/client";

type GroupedTickets = Record<TicketStatus, Awaited<ReturnType<typeof prisma.ticket.findMany>>>;

export class TicketsService {
  static async list(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        include: { client: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.ticket.count()
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateStatus(id: string, status: TicketStatus) {
    return prisma.ticket.update({
      where: { id },
      data: { status }
    });
  }

  static async listGrouped() {
    const tickets = await prisma.ticket.findMany({
      include: { client: true }
    });

    const grouped: GroupedTickets = {
      NEW: [],
      IN_PROGRESS: [],
      WAITING_CLIENT: [],
      DONE: []
    };

    tickets.forEach(ticket => {
      grouped[ticket.status].push(ticket);
    });

    return grouped;
  }

  static async getMessages(ticketId: string) {
    return prisma.message.findMany({
      where: { ticketId },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  }
}