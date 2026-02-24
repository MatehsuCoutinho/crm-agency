import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import { authMiddleware } from "./middlewares/auth.middleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("CRM Backend Running");
});

const PORT = process.env.PORT || 4000;

app.use("/auth", authRoutes);
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authenticated" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
