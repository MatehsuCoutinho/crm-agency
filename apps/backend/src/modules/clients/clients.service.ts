import { prisma } from "../../lib/prisma";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ClientsService {
    static async create(data: any, userId: string) {
        return prisma.client.create({
            data: {
                ...data,
                assignedToId: userId
            }
        });
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