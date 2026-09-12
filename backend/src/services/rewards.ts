export type Difficulty = "Easy" | "Medium" | "Hard" | "Epic";
export type Category =
  | "Coding" | "Study" | "Fitness" | "Health" | "Work"
  | "Personal" | "Reading" | "Creativity" | "Social" | "Custom";

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Epic"];
export const CATEGORIES: Category[] = [
  "Coding", "Study", "Fitness", "Health", "Work",
  "Personal", "Reading", "Creativity", "Social", "Custom",
];

// Server is the single source of truth for rewards - the frontend can never
// set xpReward/goldReward directly.
const REWARD_TABLE: Record<Difficulty, { xp: number; gold: number; attribute: number }> = {
  Easy:   { xp: 20,  gold: 5,  attribute: 1 },
  Medium: { xp: 50,  gold: 15, attribute: 2 },
  Hard:   { xp: 100, gold: 30, attribute: 3 },
  Epic:   { xp: 250, gold: 75, attribute: 5 },
};

export function getRewardsForDifficulty(difficulty: Difficulty) {
  return REWARD_TABLE[difficulty];
}

export interface AttributeDelta {
  strength: number;
  intellect: number;
  discipline: number;
  vitality: number;
  creativity: number;
  social: number;
}

// Maps a quest category to the attribute it trains.
const CATEGORY_ATTRIBUTE_MAP: Record<Category, keyof AttributeDelta> = {
  Coding: "intellect",
  Study: "intellect",
  Reading: "intellect",
  Fitness: "strength",
  Health: "vitality",
  Work: "discipline",
  Personal: "discipline",
  Creativity: "creativity",
  Social: "social",
  Custom: "discipline",
};

export function getAttributeDeltaForQuest(category: Category, difficulty: Difficulty): AttributeDelta {
  const delta: AttributeDelta = {
    strength: 0, intellect: 0, discipline: 0, vitality: 0, creativity: 0, social: 0,
  };
  const key = CATEGORY_ATTRIBUTE_MAP[category] ?? "discipline";
  delta[key] = REWARD_TABLE[difficulty].attribute;
  return delta;
}
