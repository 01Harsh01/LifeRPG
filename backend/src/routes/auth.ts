import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { computeLevelFromXp } from "../services/xp";

const router = Router();

const isProd = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(60),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

router.post("/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors[0]?.message || "Invalid input.");
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new AppError(409, "An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      attributes: { create: {} },
    },
  });

  const token = signToken({ userId: user.id });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, level: user.level, xp: user.xp, gold: user.gold },
  });
}));

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

router.post("/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors[0]?.message || "Invalid input.");
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new AppError(401, "Incorrect email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Incorrect email or password.");
  }

  const levelInfo = computeLevelFromXp(user.xp);
  if (user.level !== levelInfo.level) {
    await prisma.user.update({
      where: { id: user.id },
      data: { level: levelInfo.level },
    });
  }

  const equippedItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id, equipped: true },
    include: { item: true },
  });

  const token = signToken({ userId: user.id });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      level: levelInfo.level,
      xp: user.xp,
      gold: user.gold,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      equippedItems: equippedItems.map((i: any) => i.item),
    },
  });
}));

router.post("/logout", (_req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ success: true });
});

router.get("/me", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) throw new AppError(404, "User not found.");

  const levelInfo = computeLevelFromXp(user.xp);
  if (user.level !== levelInfo.level) {
    await prisma.user.update({
      where: { id: user.id },
      data: { level: levelInfo.level },
    });
  }

  const equippedItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id, equipped: true },
    include: { item: true },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      level: levelInfo.level,
      xp: user.xp,
      gold: user.gold,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      equippedItems: equippedItems.map((i: any) => i.item),
    },
  });
}));

export default router;
