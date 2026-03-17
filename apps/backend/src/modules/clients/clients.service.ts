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

  static async list(user: TokenPayload, page: number, limit: number, search?: string) {
    const where = {
      ...(user.role === "ADMIN" ? {} : { assignedToId: user.userId }),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } }
        ]
      } : {})
    };

    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        include: { assignedTo: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.client.count({ where })
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
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