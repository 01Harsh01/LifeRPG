// Non-linear XP progression: XP required to COMPLETE level N is 100 * N^1.5
export function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

// Given total lifetime XP, derive current level + progress within that level.
export function computeLevelFromXp(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, totalXp);
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

// Applies XP gain to a starting total, returns before/after level info so the
// caller can detect (possibly multiple) level-ups.
export function applyXpGain(currentTotalXp: number, gained: number) {
  const before = computeLevelFromXp(currentTotalXp);
  const newTotalXp = Math.max(0, currentTotalXp + Math.max(0, gained));
  const after = computeLevelFromXp(newTotalXp);
  return {
    newTotalXp,
    beforeLevel: before.level,
    afterLevel: after.level,
    leveledUp: after.level > before.level,
    levelsGained: after.level - before.level,
    xpIntoLevel: after.xpIntoLevel,
    xpForNextLevel: after.xpForNextLevel,
  };
}
