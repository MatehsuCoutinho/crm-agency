import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./modules/auth/auth.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import usersRoutes from "./modules/users/users.routes";
import ticketsRoutes from "./modules/tickets/tickets.routes";
import { prisma } from "./lib/prisma";
import metricsRoutes from "./modules/metrics/metrics.routes";
import clientAuthRoutes from "./modules/client/client.routes";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/clients", clientsRoutes);
app.use("/client", clientAuthRoutes);
app.use("/tickets", ticketsRoutes);
app.use("/metrics", metricsRoutes);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.data.user.userId);

  socket.on("join_ticket", (ticketId: string) => {
    socket.join(`ticket:${ticketId}`);
  });

  socket.on("send_message", async ({ ticketId, content }) => {
    if (!ticketId || !content?.trim()) {
      socket.emit("error", { message: "ticketId and content are required" });
      return;
    }
    try {
      const message = await prisma.message.create({
        data: {
          content,
          ticketId,
          senderId: socket.data.user.userId
        },
        include: {
          sender: {
            select: { id: true, name: true }
          }
        }
      });
      io.to(`ticket:${ticketId}`).emit("receive_message", message);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});