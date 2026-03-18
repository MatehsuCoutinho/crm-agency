import { prisma } from "../../lib/prisma";

interface UpdateUserData {
    name?: string;
    email?: string;
}

export class UsersService {
    static async list() {
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });
    }

    static async update(id: string, data: UpdateUserData) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true
            }
        });
    }

    static async deactivate(id: string) {
        return prisma.user.update({
            where: { id },
            data: { active: false },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true
            }
        });
    }
}