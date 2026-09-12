function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Determines the new streak values given the user's last quest-completion
// date and "now" (server clock only - never trust client timestamps).
export function computeStreakUpdate(lastQuestDate: Date | null, now: Date, currentStreak: number, longestStreak: number) {
  const today = toDateOnly(now);

  if (!lastQuestDate) {
    const currentStreakOut = 1;
    return { currentStreak: currentStreakOut, longestStreak: Math.max(longestStreak, currentStreakOut), lastQuestDate: now };
  }

  const lastDay = toDateOnly(lastQuestDate);

  if (lastDay === today) {
    // Already logged a completion today - streak doesn't change, and this
    // prevents inflating streaks by completing many quests in one day.
    return { currentStreak, longestStreak, lastQuestDate: now };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateOnly(yesterday);

  let newStreak: number;
  if (lastDay === yesterdayStr) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1; // missed a day (or more) - reset
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastQuestDate: now,
  };
}
