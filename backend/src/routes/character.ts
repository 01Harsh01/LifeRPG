import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { computeLevelFromXp } from "../services/xp";

const router = Router();
router.use(requireAuth);

function computeRank(level: number): { rankTitle: string; rankTier: string } {
  if (level >= 20) return { rankTitle: "Mythic Legend", rankTier: "Tier IV" };
  if (level >= 10) return { rankTitle: "Master Hero", rankTier: "Tier III" };
  if (level >= 5) return { rankTitle: "Adept Warrior", rankTier: "Tier II" };
  return { rankTitle: "Novice Adventurer", rankTier: "Tier I" };
}

router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: { attributes: true },
  });
  if (!user) throw new AppError(404, "User not found.");

  const levelInfo = computeLevelFromXp(user.xp);
  const equippedItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id, equipped: true },
    include: { item: true },
  });

  const rank = computeRank(levelInfo.level);

  res.json({
    character: {
      id: user.id,
      name: user.name,
      level: levelInfo.level,
      xp: user.xp,
      xpIntoLevel: levelInfo.xpIntoLevel,
      xpForNextLevel: levelInfo.xpForNextLevel,
      gold: user.gold,
      skillPoints: user.skillPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakFreezeActive: user.streakFreezeActive,
      adventureWorld: user.adventureWorld,
      rankTitle: rank.rankTitle,
      rankTier: rank.rankTier,
      attributes: user.attributes,
      equippedItems: equippedItems.map((i: any) => i.item),
    },
  });
}));

// POST /api/character/streak-freeze - Buy and activate Streak Freeze (100 gold)
router.post("/streak-freeze", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.streakFreezeActive) {
    throw new AppError(400, "Streak Freeze is already active!");
  }
  if (user.gold < 100) {
    throw new AppError(400, "You need at least 100 Gold to activate Streak Freeze.");
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        gold: { decrement: 100 },
        streakFreezeActive: true,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "purchase",
        message: "Activated 🧊 Streak Freeze Protection",
        goldGained: -100,
      },
    });
  });

  res.json({ success: true, streakFreezeActive: true, remainingGold: user.gold - 100 });
}));

// POST /api/character/advance-world - Unlock next adventure realm
router.post("/advance-world", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const levelInfo = computeLevelFromXp(user.xp);

  const nextWorld = user.adventureWorld + 1;
  const levelRequirements: Record<number, number> = {
    2: 3,
    3: 6,
    4: 10,
    5: 15,
  };

  const reqLevel = levelRequirements[nextWorld] || 999;
  if (levelInfo.level < reqLevel) {
    throw new AppError(400, `You must reach Level ${reqLevel} to unlock Realm ${nextWorld}.`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { adventureWorld: nextWorld },
  });

  res.json({ success: true, adventureWorld: nextWorld });
}));

export default router;
