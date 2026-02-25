import { prisma } from "../../lib/prisma";

export class ClientsService {
    static async create(data: any, userId: string) {
        const client = await prisma.client.create({
            data: {
                ...data,
                assignedToId: userId
            }
        });

        await prisma.ticket.create({
            data: {
                clientId: client.id
            }
        });

        return client;
    }

    static async list(user: any) {
        if (user.role === "ADMIN") {
            return prisma.client.findMany({
                include: { assignedTo: true }
            });
        }

        return prisma.client.findMany({
            where: { assignedToId: user.userId },
            include: { assignedTo: true }
        });
    }

    static async update(id: string, data: any) {
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