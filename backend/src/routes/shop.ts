import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (_req, res) => {
  const items = await prisma.shopItem.findMany({ orderBy: [{ type: "asc" }, { price: "asc" }] });
  res.json({ items });
}));

router.post("/:id/purchase", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const item = await prisma.shopItem.findUnique({ where: { id: req.params.id } });
  if (!item) throw new AppError(404, "Shop item not found.");

  const result = await prisma.$transaction(async (tx: any) => {
    // Re-read user balance inside the transaction and validate on the server -
    // price is NEVER taken from the request body.
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.gold < item.price) {
      throw new AppError(400, "Not enough gold for this item.");
    }

    const existing = await tx.inventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId: item.id } },
    });

    // Cosmetic one-of-a-kind items (Title/Badge/Frame) shouldn't stack; Themes
    // are treated as unlockable once too. Only allow >1 quantity implicitly
    // if we ever add consumables - for now, block duplicate purchases.
    if (existing) {
      throw new AppError(409, "You already own this item.");
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { gold: { decrement: item.price } },
    });

    const inventoryItem = await tx.inventoryItem.create({
      data: { userId, itemId: item.id },
      include: { item: true },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "purchase",
        message: `Purchased "${item.name}"`,
        goldGained: -item.price,
      },
    });

    return { updatedUser, inventoryItem };
  });

  res.json({
    success: true,
    gold: result.updatedUser.gold,
    item: result.inventoryItem,
  });
}));

export default router;
