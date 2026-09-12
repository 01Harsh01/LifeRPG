import { PrismaClient } from "@prisma/client";

// Evaluates all achievement requirements for a user and unlocks any newly
// earned ones. Returns the list of newly unlocked achievements (with reward
// XP/gold already applied to the user record by the caller's transaction).
export async function checkAndUnlockAchievements(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { achievements: true },
  });

  const alreadyUnlocked = new Set(user.achievements.map((a: any) => a.achievementId));
  const allAchievements = await prisma.achievement.findMany();

  const [completedQuestCount, studyCount, fitnessCount, totalGoldEver] = await Promise.all([
    prisma.quest.count({ where: { userId, completed: true } }),
    prisma.quest.count({ where: { userId, completed: true, category: "Study" } }),
    prisma.quest.count({ where: { userId, completed: true, category: "Fitness" } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }).then((u: any) => u.gold),
  ]);

  const newlyUnlocked: typeof allAchievements = [];

  for (const achievement of allAchievements as any[]) {
    if (alreadyUnlocked.has(achievement.id)) continue;

    let earned = false;
    switch (achievement.requirement) {
      case "first_quest":
        earned = completedQuestCount >= 1;
        break;
      case "streak_7":
        earned = user.currentStreak >= 7;
        break;
      case "quests_50":
        earned = completedQuestCount >= 50;
        break;
      case "study_25":
        earned = studyCount >= 25;
        break;
      case "fitness_25":
        earned = fitnessCount >= 25;
        break;
      case "gold_1000":
        earned = totalGoldEver >= 1000;
        break;
      case "level_10":
        earned = user.level >= 10;
        break;
      default:
        earned = false;
    }

    if (earned) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      if (achievement.xpReward || achievement.goldReward) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: achievement.xpReward },
            gold: { increment: achievement.goldReward },
          },
        });
      }
      await prisma.activityLog.create({
        data: {
          userId,
          action: "achievement_unlocked",
          message: `Achievement unlocked - ${achievement.name}`,
          xpGained: achievement.xpReward,
          goldGained: achievement.goldReward,
        },
      });
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}
