import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { CATEGORIES, DIFFICULTIES, getRewardsForDifficulty, getAttributeDeltaForQuest, Category, Difficulty } from "../services/rewards";
import { applyXpGain, computeLevelFromXp } from "../services/xp";
import { computeStreakUpdate } from "../services/streak";
import { checkAndUnlockAchievements } from "../services/achievements";

const router = Router();
router.use(requireAuth);

const questSchema = z.object({
  title: z.string().trim().min(1, "Quest title is required.").max(120),
  description: z.string().max(500).optional().nullable(),
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  difficulty: z.enum(DIFFICULTIES as [Difficulty, ...Difficulty[]]),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date format." })
    .optional()
    .nullable(),
});

// GET /api/quests?status=active|completed&category=&search=
router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const { status, category, search } = req.query as Record<string, string | undefined>;
  const where: any = { userId: req.userId };
  if (status === "active") where.completed = false;
  if (status === "completed") where.completed = true;
  if (category) where.category = category;
  if (search) where.title = { contains: search };

  const quests = await prisma.quest.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json({ quests });
}));

router.post("/", asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = questSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors[0]?.message || "Invalid quest.");
  const { title, description, category, difficulty, dueDate } = parsed.data;

  // Rewards are ALWAYS computed server-side from difficulty - never trusted from the client.
  const { xp, gold } = getRewardsForDifficulty(difficulty);

  const quest = await prisma.quest.create({
    data: {
      userId: req.userId!,
      title,
      description: description || null,
      category,
      difficulty,
      xpReward: xp,
      goldReward: gold,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  res.status(201).json({ quest });
}));

router.put("/:id", asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = questSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors[0]?.message || "Invalid quest.");

  const existing = await prisma.quest.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    throw new AppError(404, "Quest not found.");
  }
  if (existing.completed) {
    throw new AppError(400, "Completed quests cannot be edited.");
  }

  const data: any = { ...parsed.data };
  if (data.dueDate !== undefined) {
    data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  // If difficulty changed, recompute server-side rewards.
  const nextDifficulty = (data.difficulty ?? existing.difficulty) as Difficulty;
  const rewards = getRewardsForDifficulty(nextDifficulty);
  data.xpReward = rewards.xp;
  data.goldReward = rewards.gold;

  const quest = await prisma.quest.update({ where: { id: existing.id }, data });
  res.json({ quest });
}));

router.delete("/:id", asyncHandler(async (req: AuthedRequest, res) => {
  const existing = await prisma.quest.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    throw new AppError(404, "Quest not found.");
  }
  await prisma.quest.delete({ where: { id: existing.id } });
  res.json({ success: true });
}));

router.post("/:id/complete", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const quest = await prisma.quest.findUnique({ where: { id: req.params.id } });
  if (!quest || quest.userId !== userId) {
    throw new AppError(404, "Quest not found.");
  }
  if (quest.completed) {
    throw new AppError(400, "This quest has already been completed.");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const attrDelta = getAttributeDeltaForQuest(quest.category as Category, quest.difficulty as Difficulty);

  // Total lifetime XP is tracked as (level progress); we store "xp" as total
  // lifetime XP for simplicity and derive level/progress from it on read.
  const xpResult = applyXpGain(totalXpFromUser(user), quest.xpReward);
  const streakResult = computeStreakUpdate(user.lastQuestDate, new Date(), user.currentStreak, user.longestStreak);

  const result = await prisma.$transaction(async (tx: any) => {
    await tx.quest.update({
      where: { id: quest.id },
      data: { completed: true, completedAt: new Date() },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        xp: xpResult.newTotalXp,
        level: xpResult.afterLevel,
        gold: { increment: quest.goldReward },
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastQuestDate: streakResult.lastQuestDate,
      },
    });

    await tx.characterAttribute.update({
      where: { userId },
      data: {
        strength: { increment: attrDelta.strength },
        intellect: { increment: attrDelta.intellect },
        discipline: { increment: attrDelta.discipline },
        vitality: { increment: attrDelta.vitality },
        creativity: { increment: attrDelta.creativity },
        social: { increment: attrDelta.social },
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        taskId: quest.id,
        action: "quest_completed",
        message: `Completed "${quest.title}"`,
        xpGained: quest.xpReward,
        goldGained: quest.goldReward,
      },
    });

    if (xpResult.leveledUp) {
      await tx.user.update({
        where: { id: userId },
        data: { skillPoints: { increment: xpResult.levelsGained } },
      });
      await tx.activityLog.create({
        data: {
          userId,
          action: "level_up",
          message: `Reached level ${xpResult.afterLevel}! (+${xpResult.levelsGained} Skill Point)`,
        },
      });
    }

    // Quest XP also strikes the active World Boss
    const activeBoss = await tx.userBoss.findFirst({
      where: { userId, defeated: false },
      orderBy: { createdAt: "desc" },
    });
    if (activeBoss) {
      const newHp = Math.max(0, activeBoss.currentHp - quest.xpReward);
      const defeated = newHp <= 0;
      await tx.userBoss.update({
        where: { id: activeBoss.id },
        data: { currentHp: newHp, defeated },
      });
      if (defeated) {
        await tx.user.update({
          where: { id: userId },
          data: {
            gold: { increment: activeBoss.goldReward },
            xp: { increment: activeBoss.xpReward },
            skillPoints: { increment: 1 },
          },
        });
        await tx.activityLog.create({
          data: {
            userId,
            action: "boss_defeated",
            message: `🏆 Slew World Boss "${activeBoss.name}" in quest combat!`,
            xpGained: activeBoss.xpReward,
            goldGained: activeBoss.goldReward,
          },
        });
      }
    }

    return updatedUser;
  });

  const newAchievements = await checkAndUnlockAchievements(prisma, userId);
  const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const levelInfo = computeLevelFromXp(finalUser.xp);

  res.json({
    quest: { ...quest, completed: true },
    xpGained: quest.xpReward,
    goldGained: quest.goldReward,
    attributeGained: attrDelta,
    leveledUp: xpResult.leveledUp,
    levelsGained: xpResult.levelsGained,
    beforeLevel: xpResult.beforeLevel,
    afterLevel: xpResult.afterLevel,
    user: {
      id: finalUser.id,
      level: finalUser.level,
      xp: finalUser.xp,
      gold: finalUser.gold,
      skillPoints: finalUser.skillPoints,
      currentStreak: finalUser.currentStreak,
      longestStreak: finalUser.longestStreak,
      xpIntoLevel: levelInfo.xpIntoLevel,
      xpForNextLevel: levelInfo.xpForNextLevel,
    },
    newAchievements,
  });
}));

// POST /api/quests/generate-daily - AI/Automatic Daily Missions Generator
router.post("/generate-daily", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const templates = [
    { title: "Defeat 3 Algorithmic Challenges", description: "Solve data structures or logic coding challenges.", category: "Coding" as Category, difficulty: "Medium" as Difficulty },
    { title: "Physical Conditioning & Calisthenics", description: "Complete a workout session, jog, or core training.", category: "Fitness" as Category, difficulty: "Medium" as Difficulty },
    { title: "Tome of Wisdom Reading", description: "Read 25 pages of non-fiction, research, or technical docs.", category: "Reading" as Category, difficulty: "Easy" as Difficulty },
    { title: "Mindful Deep Work Session", description: "90 minutes of zero-distraction focus on primary project.", category: "Work" as Category, difficulty: "Hard" as Difficulty },
    { title: "Health & Vitality Regeneration", description: "Drink 2L water, stretch, and get quality sleep.", category: "Health" as Category, difficulty: "Easy" as Difficulty },
  ];

  // Pick 3 unique random missions
  const shuffled = templates.sort(() => 0.5 - Math.random()).slice(0, 3);
  const created = [];

  for (const t of shuffled) {
    const rewards = getRewardsForDifficulty(t.difficulty);
    const q = await prisma.quest.create({
      data: {
        userId,
        title: t.title,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        xpReward: rewards.xp,
        goldReward: rewards.gold,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    created.push(q);
  }

  res.status(201).json({ quests: created });
}));

function totalXpFromUser(user: { xp: number }) {
  return user.xp;
}

export default router;
