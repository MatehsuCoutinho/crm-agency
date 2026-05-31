import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export interface TokenPayload {
  userId: string;
  role: "ADMIN" | "ATTENDANT" | "CLIENT";
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token not provided" });
  }

  const token = authHeader.split(" ")[1];

  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET!) as unknown as TokenPayload;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (decoded.role === "CLIENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { active: true }
  });

  if (!user || !user.active) {
    return res.status(403).json({ error: "Account deactivated" });
  }

  req.user = decoded;
  next();
}