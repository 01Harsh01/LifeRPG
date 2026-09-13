import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const now = new Date();

  // 1. Fetch user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.json({ notifications: [], totalCount: 0, remindersCount: 0 });

  const notifications: any[] = [];

  // 2. Quest Reminders:
  const uncompletedQuests = await prisma.quest.findMany({
    where: { userId, completed: false },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const dueQuests = uncompletedQuests.filter((q) => {
    if (!q.dueDate) return false;
    const due = new Date(q.dueDate);
    return due <= todayEnd;
  });

  if (dueQuests.length > 0) {
    notifications.push({
      id: `reminder-due-quests-${todayStart.toISOString().slice(0, 10)}`,
      type: "reminder",
      priority: "urgent",
      title: "⚔️ Quest Deadline Alert",
      message: `You have ${dueQuests.length} quest${dueQuests.length > 1 ? "s" : ""} due today (${dueQuests.map((q) => `"${q.title}"`).slice(0, 2).join(", ")}${dueQuests.length > 2 ? "..." : ""}). Conquer them before midnight!`,
      timestamp: now.toISOString(),
      actionUrl: "/quests",
      actionLabel: "View Due Quests",
      badge: "Due Today",
    });
  } else if (uncompletedQuests.length > 0) {
    notifications.push({
      id: `reminder-pending-quests-${todayStart.toISOString().slice(0, 10)}`,
      type: "reminder",
      priority: "medium",
      title: "📜 Quest Log Awaiting Action",
      message: `You have ${uncompletedQuests.length} quest${uncompletedQuests.length > 1 ? "s" : ""} waiting to be conquered. Level up your stats and earn gold!`,
      timestamp: now.toISOString(),
      actionUrl: "/quests",
      actionLabel: "Open Quest Log",
      badge: `${uncompletedQuests.length} Remaining`,
    });
  } else {
    notifications.push({
      id: `reminder-no-quests-${todayStart.toISOString().slice(0, 10)}`,
      type: "reminder",
      priority: "low",
      title: "✨ All Quests Complete!",
      message: "Your quest log is clear. Create a new quest to continue leveling up your character attributes.",
      timestamp: now.toISOString(),
      actionUrl: "/quests",
      actionLabel: "New Quest",
      badge: "Clear",
    });
  }

  // 3. Streak Warning / Protection Reminder
  const lastQuestDate = user.lastQuestDate ? new Date(user.lastQuestDate) : null;
  const isCompletedToday = lastQuestDate && lastQuestDate >= todayStart;

  if (user.currentStreak > 0 && !isCompletedToday) {
    notifications.push({
      id: `reminder-streak-${todayStart.toISOString().slice(0, 10)}`,
      type: "streak",
      priority: "high",
      title: "🔥 Streak Danger Warning",
      message: `You have an active ${user.currentStreak}-day streak! Complete at least one quest before midnight to keep your streak flame burning.`,
      timestamp: now.toISOString(),
      actionUrl: "/quests",
      actionLabel: "Save Streak",
      badge: `${user.currentStreak} Days`,
    });
  } else if (isCompletedToday && user.currentStreak > 0) {
    notifications.push({
      id: `streak-safe-${todayStart.toISOString().slice(0, 10)}`,
      type: "streak",
      priority: "low",
      title: "🔥 Streak Secured Today!",
      message: `Outstanding discipline! Your ${user.currentStreak}-day streak has been successfully extended for today.`,
      timestamp: user.lastQuestDate!.toISOString(),
      badge: "Protected",
    });
  }

  // 4. Daily Mystery Chest Reminder
  const claimedChestToday = await prisma.activityLog.findFirst({
    where: {
      userId,
      action: "mystery_chest",
      createdAt: { gte: todayStart },
    },
  });

  if (!claimedChestToday) {
    notifications.push({
      id: `reminder-chest-${todayStart.toISOString().slice(0, 10)}`,
      type: "reward",
      priority: "medium",
      title: "🎁 Daily Mystery Chest Ready",
      message: "Your daily adventurer mystery bounty is ready to open on the Dashboard!",
      timestamp: now.toISOString(),
      actionUrl: "/dashboard",
      actionLabel: "Open Chest",
      badge: "Free Loot",
    });
  }

  // 5. Boss Battle Status Reminder
  const activeBoss = await prisma.userBoss.findFirst({
    where: { userId, defeated: false },
  });

  if (activeBoss) {
    const hpPercent = Math.round((activeBoss.currentHp / activeBoss.maxHp) * 100);
    notifications.push({
      id: `reminder-boss-${activeBoss.id}`,
      type: "boss",
      priority: hpPercent < 30 ? "high" : "medium",
      title: `🐉 Raid in Progress: ${activeBoss.name}`,
      message: `The World Boss is at ${hpPercent}% HP (${activeBoss.currentHp}/${activeBoss.maxHp} HP). Strike by completing quests!`,
      timestamp: activeBoss.createdAt.toISOString(),
      actionUrl: "/boss",
      actionLabel: "Attack Boss",
      badge: `${hpPercent}% HP`,
    });
  }

  // 6. Recent Activity Log Entries
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  for (const log of logs) {
    let type = "system";
    let priority: "low" | "medium" | "high" = "low";
    let title = "Accomplishment";
    let badge = "";

    if (log.action === "quest_completed") {
      type = "quest";
      title = "⚔️ Quest Completed";
      badge = `+${log.xpGained} XP`;
    } else if (log.action === "level_up") {
      type = "level_up";
      priority = "high";
      title = "🌟 Level Up Milestone!";
      badge = "Level Up";
    } else if (log.action === "achievement_unlocked") {
      type = "reward";
      priority = "high";
      title = "🏆 Achievement Unlocked";
      badge = "Trophy";
    } else if (log.action === "boss_damage" || log.action === "boss_defeated") {
      type = "boss";
      title = log.action === "boss_defeated" ? "👑 Boss Defeated!" : "💥 Boss Hit";
      badge = log.action === "boss_defeated" ? "Victory" : "Raid";
    } else if (log.action === "purchase") {
      type = "reward";
      title = "💰 Bazaar Purchase";
      badge = `${log.goldGained} 🪙`;
    }

    notifications.push({
      id: `log-${log.id}`,
      type,
      priority,
      title,
      message: log.message,
      timestamp: log.createdAt.toISOString(),
      badge,
    });
  }

  const urgentCount = notifications.filter((n) => n.priority === "urgent" || n.priority === "high").length;

  res.json({
    notifications,
    totalCount: notifications.length,
    remindersCount: urgentCount,
  });
}));

export default router;
