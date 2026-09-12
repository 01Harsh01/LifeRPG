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

// GET /api/character/streak-calendar - Monthly streak calendar and weekly milestones
router.get("/streak-calendar", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const now = new Date();
  const requestedYear = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
  const requestedMonth = req.query.month ? parseInt(req.query.month as string) : (now.getMonth() + 1);

  const firstDay = new Date(requestedYear, requestedMonth - 1, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(requestedYear, requestedMonth, 0).getDate();

  const startOfMonth = new Date(requestedYear, requestedMonth - 1, 1);
  const endOfMonth = new Date(requestedYear, requestedMonth, 0, 23, 59, 59, 999);

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      action: "quest_completed",
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: { createdAt: true },
  });

  const activeDaysSet = new Set<number>();
  logs.forEach((l: any) => {
    activeDaysSet.add(l.createdAt.getDate());
  });

  const isCurrentMonth = now.getFullYear() === requestedYear && (now.getMonth() + 1) === requestedMonth;
  const todayDate = now.getDate();

  if (isCurrentMonth && user.currentStreak > 0) {
    const lastDayStr = user.lastQuestDate ? user.lastQuestDate.toISOString().slice(0, 10) : null;
    const todayStr = now.toISOString().slice(0, 10);
    const completedToday = lastDayStr === todayStr;

    const streakStartDay = completedToday ? todayDate : (todayDate - 1);
    for (let i = 0; i < user.currentStreak; i++) {
      const dayNum = streakStartDay - i;
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        activeDaysSet.add(dayNum);
      }
    }
  }

  const currentDayOfWeek = now.getDay();
  const daysLeftInWeek = 7 - (currentDayOfWeek === 0 ? 7 : currentDayOfWeek);
  const currentWeekNumber = Math.min(5, Math.ceil(todayDate / 7));

  const weeklyMilestones = [1, 2, 3, 4, 5].map((w) => {
    const startDay = (w - 1) * 7 + 1;
    const endDay = Math.min(daysInMonth, w * 7);
    if (startDay > daysInMonth) return null;

    let activeInWeek = 0;
    for (let d = startDay; d <= endDay; d++) {
      if (activeDaysSet.has(d)) activeInWeek++;
    }

    return {
      week: `W${w}`,
      weekNumber: w,
      startDay,
      endDay,
      activeDays: activeInWeek,
      totalDays: endDay - startDay + 1,
      isCompleted: activeInWeek >= Math.min(3, endDay - startDay + 1),
      isCurrent: isCurrentMonth && currentWeekNumber === w,
    };
  }).filter(Boolean);

  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const secondsLeft = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));

  const redeemedCount = await prisma.activityLog.count({
    where: { userId, action: "streak_redeemed" },
  });
  const totalEarnedTokens = Math.max(0, user.currentStreak * 10);
  const redeemableTokens = Math.max(0, totalEarnedTokens - (redeemedCount * 50));

  res.json({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    todayDate: isCurrentMonth ? todayDate : null,
    isCurrentMonth,
    todayCompleted: user.lastQuestDate ? user.lastQuestDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10) : false,
    streakFreezeActive: user.streakFreezeActive,
    year: requestedYear,
    month: requestedMonth,
    monthName: firstDay.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    startDayOfWeek,
    daysInMonth,
    activeDays: Array.from(activeDaysSet).sort((a, b) => a - b),
    secondsUntilMidnight: secondsLeft,
    daysLeftInWeek,
    currentWeekNumber,
    weeklyMilestones,
    redeemableTokens,
  });
}));

// POST /api/character/streak-redeem - Redeem streak tokens for Gold and XP
router.post("/streak-redeem", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const redeemedCount = await prisma.activityLog.count({
    where: { userId, action: "streak_redeemed" },
  });
  const totalEarnedTokens = Math.max(0, user.currentStreak * 10);
  const available = Math.max(0, totalEarnedTokens - (redeemedCount * 50));

  if (available < 50) {
    throw new AppError(400, "You need at least 50 Streak Tokens to redeem. Keep completing daily quests to earn more!");
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        gold: { increment: 75 },
        xp: { increment: 150 },
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "streak_redeemed",
        message: "Redeemed 50 Streak Tokens for 75 🪙 Gold and 150 XP!",
        goldGained: 75,
        xpGained: 150,
      },
    });
  });

  res.json({
    success: true,
    message: "Redeemed 50 Streak Tokens! Claimed +75 🪙 Gold and +150 XP.",
    remainingTokens: available - 50,
  });
}));

export default router;

