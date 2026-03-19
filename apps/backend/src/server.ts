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
import clientAuthRoutes from "./modules/client/client.routes";
import metricsRoutes from "./modules/metrics/metrics.routes";
import { prisma } from "./lib/prisma";
import { setupSwagger } from "./swagger/swagger.setup";

dotenv.config();

const app = express();
const server = http.createServer(app);
setupSwagger(app);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

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
app.use("/tickets", ticketsRoutes);
app.use("/client", clientAuthRoutes);
app.use("/metrics", metricsRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;

    // aceita tanto CLIENT quanto ADMIN/ATTENDANT
    if (!["ADMIN", "ATTENDANT", "CLIENT"].includes(decoded.role)) {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.user.userId} (${socket.data.user.role})`);

  socket.on("join_ticket", async (ticketId: string) => {
    // se for cliente, valida se o ticket pertence a ele
    if (socket.data.user.role === "CLIENT") {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket || ticket.clientId !== socket.data.user.clientId) {
        socket.emit("error", { message: "Ticket not found" });
        return;
      }
    }

    socket.join(`ticket:${ticketId}`);
    console.log(`${socket.data.user.role} joined ticket: ${ticketId}`);
  });

  socket.on("send_message", async ({ ticketId, content }) => {
    if (!ticketId || !content?.trim()) {
      socket.emit("error", { message: "ticketId and content are required" });
      return;
    }

    // se for cliente, valida se o ticket pertence a ele
    if (socket.data.user.role === "CLIENT") {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket || ticket.clientId !== socket.data.user.clientId) {
        socket.emit("error", { message: "Ticket not found" });
        return;
      }
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
            select: { id: true, name: true, role: true }
          }
        }
      });

      io.to(`ticket:${ticketId}`).emit("receive_message", message);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", ({ ticketId }) => {
    socket.to(`ticket:${ticketId}`).emit("user_typing", {
      userId: socket.data.user.userId,
      name: socket.data.user.name,
      role: socket.data.user.role
    });
  });

  socket.on("stop_typing", ({ ticketId }) => {
    socket.to(`ticket:${ticketId}`).emit("user_stop_typing", {
      userId: socket.data.user.userId
    });
  });

  socket.on("leave_ticket", (ticketId: string) => {
    socket.leave(`ticket:${ticketId}`);
    console.log(`${socket.data.user.role} left ticket: ${ticketId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.user.userId}`);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/docs`);
});