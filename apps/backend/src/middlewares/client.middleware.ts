import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

export interface ClientTokenPayload {
    userId: string;
    clientId: string;
    role: "CLIENT";
}

export interface ClientRequest extends Request {
    client?: ClientTokenPayload;
}

export async function clientMiddleware(
    req: ClientRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded: ClientTokenPayload;
    try {
        decoded = jwt.verify(token, JWT_SECRET!) as unknown as ClientTokenPayload;
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }

    if (decoded.role !== "CLIENT") {
        return res.status(403).json({ error: "Access denied" });
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { active: true }
    });

    if (!user || !user.active) {
        return res.status(403).json({ error: "Account deactivated" });
    }

    req.client = decoded;
    next();
}