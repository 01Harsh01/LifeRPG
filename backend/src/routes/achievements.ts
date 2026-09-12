import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const [all, unlocked] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId: req.userId! } }),
  ]);
  const unlockedMap = new Map(unlocked.map((u: any) => [u.achievementId, u.unlockedAt]));

  const achievements = all.map((a: any) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) || null,
  }));

  res.json({ achievements });
}));

export default router;
