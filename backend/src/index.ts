// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", chatRoutes);

// Simple health check route
app.get("/", (req, res) => res.send("Backend running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));