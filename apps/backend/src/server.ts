import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import usersRoutes from "./modules/users/users.routes";
import ticketsRoutes from "./modules/tickets/tickets.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CRM Backend Running");
});

const PORT = process.env.PORT || 4000;

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/clients", clientsRoutes);
app.use("/tickets", ticketsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
