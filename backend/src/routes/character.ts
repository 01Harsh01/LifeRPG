import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { computeLevelFromXp } from "../services/xp";

const router = Router();
router.use(requireAuth);

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

  res.json({
    character: {
      id: user.id,
      name: user.name,
      level: levelInfo.level,
      xp: user.xp,
      xpIntoLevel: levelInfo.xpIntoLevel,
      xpForNextLevel: levelInfo.xpForNextLevel,
      gold: user.gold,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      attributes: user.attributes,
      equippedItems: equippedItems.map((i: any) => i.item),
    },
  });
}));

export default router;
