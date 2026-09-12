// Non-linear RPG Leveling Engine
// XP required to complete level N: round(100 * N^1.5)
export function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(Math.max(1, level), 1.5));
}

// Given total lifetime XP, accurately compute level + progress into next level
export function computeLevelFromXp(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, totalXp || 0);
  let needed = xpRequiredForLevel(level);

  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpRequiredForLevel(level);
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: needed,
  };
}
