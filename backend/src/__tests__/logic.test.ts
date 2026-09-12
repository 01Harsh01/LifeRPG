import { xpRequiredForLevel, computeLevelFromXp, applyXpGain } from "../services/xp";
import { getRewardsForDifficulty, getAttributeDeltaForQuest } from "../services/rewards";
import { computeStreakUpdate } from "../services/streak";

describe("XP / leveling", () => {
  it("computes non-linear xp requirements", () => {
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(2)).toBeGreaterThan(xpRequiredForLevel(1));
    expect(xpRequiredForLevel(3)).toBeGreaterThan(xpRequiredForLevel(2));
  });

  it("levels up exactly at the threshold", () => {
    const info = computeLevelFromXp(100);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(0);
  });

  it("handles multiple level-ups from a single large XP gain", () => {
    const result = applyXpGain(0, 1000);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBeGreaterThan(1);
  });

  it("never allows negative total xp", () => {
    const result = applyXpGain(50, -1000);
    expect(result.newTotalXp).toBeGreaterThanOrEqual(0);
  });
});

describe("Reward calculation", () => {
  it("returns fixed server-side rewards per difficulty", () => {
    expect(getRewardsForDifficulty("Easy")).toEqual({ xp: 20, gold: 5, attribute: 1 });
    expect(getRewardsForDifficulty("Epic")).toEqual({ xp: 250, gold: 75, attribute: 5 });
  });

  it("maps quest category to the correct attribute", () => {
    const delta = getAttributeDeltaForQuest("Fitness", "Medium");
    expect(delta.strength).toBe(2);
    expect(delta.intellect).toBe(0);
  });
});

describe("Streak calculation", () => {
  const day1 = new Date("2026-01-01T08:00:00Z");
  const day2 = new Date("2026-01-02T08:00:00Z");
  const day4 = new Date("2026-01-04T08:00:00Z");

  it("starts a streak at 1 on first ever completion", () => {
    const r = computeStreakUpdate(null, day1, 0, 0);
    expect(r.currentStreak).toBe(1);
  });

  it("increments on consecutive days", () => {
    const r = computeStreakUpdate(day1, day2, 1, 1);
    expect(r.currentStreak).toBe(2);
  });

  it("does not increment twice in the same day", () => {
    const r = computeStreakUpdate(day1, day1, 3, 5);
    expect(r.currentStreak).toBe(3);
  });

  it("resets streak after a missed day", () => {
    const r = computeStreakUpdate(day1, day4, 5, 5);
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(5);
  });
});
