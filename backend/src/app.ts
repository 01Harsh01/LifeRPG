import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import questRoutes from "./routes/quests";
import characterRoutes from "./routes/character";
import shopRoutes from "./routes/shop";
import inventoryRoutes from "./routes/inventory";
import achievementRoutes from "./routes/achievements";
import activityRoutes from "./routes/activity";
import bossRoutes from "./routes/boss";
import skillRoutes from "./routes/skills";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api", limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/", (_req, res) => res.json({ name: "Life RPG API", status: "online", health: "/api/health" }));
app.get("/api", (_req, res) => res.json({ name: "Life RPG API", status: "online", health: "/api/health" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/character", characterRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/boss", bossRoutes);
app.use("/api/skills", skillRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
