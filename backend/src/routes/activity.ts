import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const { filter } = req.query as { filter?: string };
  const where: any = { userId: req.userId! };
  if (filter && filter !== "All") {
    const map: Record<string, string[]> = {
      Quests: ["quest_completed"],
      XP: ["quest_completed", "level_up"],
      Rewards: ["level_up"],
      Achievements: ["achievement_unlocked"],
      Purchases: ["purchase"],
    };
    if (map[filter]) where.action = { in: map[filter] };
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ logs });
}));

export default router;
