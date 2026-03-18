import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

export function clientMiddleware(
    req: ClientRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token not provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as unknown as ClientTokenPayload;

        if (decoded.role !== "CLIENT") {
            return res.status(403).json({ error: "Access denied" });
        }

        req.client = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}