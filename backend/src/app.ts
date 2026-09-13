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
import notificationsRoutes from "./routes/notifications";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: (_origin, callback) => {
    // Reflect requesting origin to allow credentials from any Vercel domain or localhost
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));
app.options("*", cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api", limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use(["/api/auth/login", "/auth/login"], authLimiter);
app.use(["/api/auth/register", "/auth/register"], authLimiter);

app.get("/", (_req, res) => res.json({ name: "Life RPG API", status: "online", health: "/api/health" }));
app.get("/api", (_req, res) => res.json({ name: "Life RPG API", status: "online", health: "/api/health" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const mountRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/quests`, questRoutes);
  app.use(`${prefix}/character`, characterRoutes);
  app.use(`${prefix}/shop`, shopRoutes);
  app.use(`${prefix}/inventory`, inventoryRoutes);
  app.use(`${prefix}/achievements`, achievementRoutes);
  app.use(`${prefix}/activity`, activityRoutes);
  app.use(`${prefix}/boss`, bossRoutes);
  app.use(`${prefix}/skills`, skillRoutes);
  app.use(`${prefix}/notifications`, notificationsRoutes);
};

mountRoutes("/api");
mountRoutes("");

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
