import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

export class ClientAuthService {
    static async register(name: string, email: string, password: string, phone: string) {
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            throw new Error("Email already in use");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "CLIENT",
                clientProfile: {
                    create: {
                        name,
                        email,
                        phone
                    }
                }
            },
            include: { clientProfile: true }
        });

        return {
            name: user.name,
            email: user.email,
            phone: user.clientProfile!.phone,
            clientId: user.clientProfile!.id
        };
    }

    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { clientProfile: true }
        });

        if (!user || user.role !== "CLIENT") {
            throw new Error("Invalid credentials");
        }

        if (!user.clientProfile) {
            throw new Error("Client profile not found");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }

        const token = jwt.sign(
            {
                userId: user.id,
                clientId: user.clientProfile.id,
                role: "CLIENT"
            },
            JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return {
            token,
            user: {
                name: user.name,
                email: user.email,
                clientId: user.clientProfile.id
            }
        };
    }
}