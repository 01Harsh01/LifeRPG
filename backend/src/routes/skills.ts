import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

export const SKILL_NODES = [
  {
    key: "bounty_hunter",
    name: "Bounty Hunter",
    branch: "Economy",
    description: "Earn +15% more Gold from every quest completion.",
    icon: "💰",
    cost: 1,
    tier: 1,
  },
  {
    key: "scholar_mind",
    name: "Scholar's Mind",
    branch: "Intellect",
    description: "Gain +20% bonus XP from Coding and Study quests.",
    icon: "🧠",
    cost: 1,
    tier: 1,
  },
  {
    key: "titan_strength",
    name: "Titan Strength",
    branch: "Discipline",
    description: "Gain +2 extra Strength & Vitality attribute points per fitness quest.",
    icon: "💪",
    cost: 1,
    tier: 2,
    requires: "scholar_mind",
  },
  {
    key: "iron_will",
    name: "Iron Will",
    branch: "Discipline",
    description: "Your daily streak receives active reinforcement against resets.",
    icon: "🔥",
    cost: 1,
    tier: 2,
    requires: "bounty_hunter",
  },
  {
    key: "hyperfocus",
    name: "Deep Work Flow",
    branch: "Focus",
    description: "Pomodoro Focus sessions deal +50% bonus damage to active World Bosses.",
    icon: "⚡",
    cost: 1,
    tier: 3,
    requires: "titan_strength",
  },
  {
    key: "grandmaster",
    name: "Grandmaster Ascendance",
    branch: "Mastery",
    description: "Ascend to legendary status with a permanent 10% boost to all stats.",
    icon: "👑",
    cost: 2,
    tier: 4,
    requires: "hyperfocus",
  },
];

// GET /api/skills - Return skill nodes, unlocked skills, and available points
router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { skillPoints: true, level: true },
  });

  const unlockedSkills = await prisma.userSkill.findMany({
    where: { userId },
  });

  const unlockedKeys = new Set(unlockedSkills.map((s: any) => s.skillKey));

  const nodes = SKILL_NODES.map((node) => ({
    ...node,
    unlocked: unlockedKeys.has(node.key),
    canUnlock:
      !unlockedKeys.has(node.key) &&
      user.skillPoints >= node.cost &&
      (!node.requires || unlockedKeys.has(node.requires)),
  }));

  res.json({
    skillPoints: user.skillPoints,
    userLevel: user.level,
    nodes,
  });
}));

// POST /api/skills/unlock - Unlock a skill node
router.post("/unlock", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { skillKey } = req.body;

  const node = SKILL_NODES.find((n) => n.key === skillKey);
  if (!node) throw new AppError(404, "Skill node not found.");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.skillPoints < node.cost) {
    throw new AppError(400, "Not enough Skill Points to unlock this perk.");
  }

  const existing = await prisma.userSkill.findUnique({
    where: { userId_skillKey: { userId, skillKey } },
  });
  if (existing) {
    throw new AppError(409, "Skill already unlocked.");
  }

  if (node.requires) {
    const prereq = await prisma.userSkill.findUnique({
      where: { userId_skillKey: { userId, skillKey: node.requires } },
    });
    if (!prereq) {
      throw new AppError(400, "Prerequisite skill must be unlocked first.");
    }
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: { skillPoints: { decrement: node.cost } },
    });

    await tx.userSkill.create({
      data: { userId, skillKey },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "achievement_unlocked",
        message: `Unlocked Perk "${node.name}" in Skill Tree`,
      },
    });
  });

  res.json({ success: true, skillKey, remainingPoints: user.skillPoints - node.cost });
}));

export default router;
