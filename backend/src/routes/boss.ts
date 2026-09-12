import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { computeLevelFromXp } from "../services/xp";

const router = Router();
router.use(requireAuth);

const BOSS_CATALOG = [
  {
    bossId: "procrastination_behemoth",
    name: "The Procrastination Behemoth",
    title: "Devourer of Hours",
    icon: "👹",
    maxHp: 300,
    goldReward: 200,
    xpReward: 250,
  },
  {
    bossId: "bug_swarm_hydra",
    name: "The Bug Swarm Hydra",
    title: "Spawn of Infinite Regressions",
    icon: "🐉",
    maxHp: 600,
    goldReward: 400,
    xpReward: 500,
  },
  {
    bossId: "burnout_colossus",
    name: "The Burnout Colossus",
    title: "Titan of Exhaustion",
    icon: "🗿",
    maxHp: 1000,
    goldReward: 750,
    xpReward: 1000,
  },
  {
    bossId: "chaos_void_lord",
    name: "Lord of the Distracted Mind",
    title: "Ruler of Doom-Scrolling",
    icon: "👾",
    maxHp: 1500,
    goldReward: 1200,
    xpReward: 2000,
  },
];

// GET /api/boss/active & GET /api/boss - Gets or spawns active boss for user
const getActiveBossHandler = asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  let boss = await prisma.userBoss.findFirst({
    where: { userId, defeated: false },
    orderBy: { createdAt: "desc" },
  });

  if (!boss) {
    const defeatedCount = await prisma.userBoss.count({ where: { userId, defeated: true } });
    const template = BOSS_CATALOG[defeatedCount % BOSS_CATALOG.length];

    boss = await prisma.userBoss.create({
      data: {
        userId,
        bossId: template.bossId,
        name: template.name,
        title: template.title,
        icon: template.icon,
        maxHp: template.maxHp,
        currentHp: template.maxHp,
        goldReward: template.goldReward,
        xpReward: template.xpReward,
        tier: defeatedCount + 1,
      },
    });
  }

  const defeatedCount = await prisma.userBoss.count({ where: { userId, defeated: true } });

  res.json({
    boss,
    defeatedCount,
    totalBossesInRealm: BOSS_CATALOG.length,
  });
});

router.get("/", getActiveBossHandler);
router.get("/active", getActiveBossHandler);

// POST /api/boss/attack & POST /api/boss/strike - Deal direct damage (e.g. from Focus Pomodoro sessions)
const attackBossHandler = asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { damage = 40, source = "Focus Session" } = req.body;

  let boss = await prisma.userBoss.findFirst({
    where: { userId, defeated: false },
    orderBy: { createdAt: "desc" },
  });

  if (!boss) {
    throw new AppError(404, "No active boss to attack.");
  }

  const newHp = Math.max(0, boss.currentHp - Number(damage));
  const defeated = newHp <= 0;

  await prisma.$transaction(async (tx: any) => {
    await tx.userBoss.update({
      where: { id: boss.id },
      data: { currentHp: newHp, defeated },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: defeated ? "boss_defeated" : "boss_damage",
        message: defeated
          ? `🏆 Slain Boss "${boss.name}"!`
          : `Dealt ${damage} DMG to ${boss.name} via ${source}`,
        xpGained: defeated ? boss.xpReward : 0,
        goldGained: defeated ? boss.goldReward : 0,
      },
    });

    if (defeated) {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const newXp = user.xp + boss.xpReward;
      const levelInfo = computeLevelFromXp(newXp);
      await tx.user.update({
        where: { id: userId },
        data: {
          gold: { increment: boss.goldReward },
          xp: newXp,
          level: levelInfo.level,
          skillPoints: { increment: 1 },
        },
      });
    }
  });

  const updatedBoss = await prisma.userBoss.findUnique({ where: { id: boss.id } });

  res.json({
    boss: updatedBoss,
    damageDealt: damage,
    defeated,
    goldAwarded: defeated ? boss.goldReward : 0,
    xpAwarded: defeated ? boss.xpReward : 0,
  });
});

router.post("/attack", attackBossHandler);
router.post("/strike", attackBossHandler);

export default router;
