import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const items = await prisma.inventoryItem.findMany({
    where: { userId: req.userId! },
    include: { item: true },
    orderBy: { purchasedAt: "desc" },
  });
  res.json({ items });
}));

router.post("/:id/equip", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const invItem = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
    include: { item: true },
  });
  if (!invItem || invItem.userId !== userId) {
    throw new AppError(404, "Inventory item not found.");
  }

  await prisma.$transaction(async (tx: any) => {
    // Unequip any other item of the same type (only one Avatar/Frame/Title equipped at a time).
    await tx.inventoryItem.updateMany({
      where: { userId, equipped: true, item: { type: invItem.item.type } },
      data: { equipped: false },
    });
    await tx.inventoryItem.update({
      where: { id: invItem.id },
      data: { equipped: !invItem.equipped },
    });
  });

  const updated = await prisma.inventoryItem.findUnique({ where: { id: invItem.id }, include: { item: true } });
  res.json({ item: updated });
}));

export default router;
