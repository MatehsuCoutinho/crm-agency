import { prisma } from "../../lib/prisma";
import { TokenPayload } from "../../middlewares/auth.middleware";

interface ClientData {
  name: string;
  email: string;
  phone?: string;
}

export class ClientsService {
  static async create(data: ClientData, userId: string) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          ...data,
          assignedToId: userId
        }
      });

      await tx.ticket.create({
        data: { clientId: client.id }
      });

      return client;
    });
  }

  static async list(user: TokenPayload) {
    const where = user.role === "ADMIN" ? {} : { assignedToId: user.userId };

    return prisma.client.findMany({
      where,
      include: { assignedTo: true }
    });
  }

  static async update(id: string, data: Partial<ClientData>) {
    return prisma.client.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    return prisma.client.delete({
      where: { id }
    });
  }
}