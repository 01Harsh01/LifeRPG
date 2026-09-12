export type Difficulty = "Easy" | "Medium" | "Hard" | "Epic";
export type Category =
  | "Coding" | "Study" | "Fitness" | "Health" | "Work"
  | "Personal" | "Reading" | "Creativity" | "Social" | "Custom";

export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  gold: number;
  currentStreak?: number;
  longestStreak?: number;
}

export interface Quest {
  id: string;
  title: string;
  description?: string | null;
  category: Category;
  difficulty: Difficulty;
  xpReward: number;
  goldReward: number;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null;
  createdAt: string;
}

export interface Attributes {
  strength: number;
  intellect: number;
  discipline: number;
  vitality: number;
  creativity: number;
  social: number;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  gold: number;
  currentStreak: number;
  longestStreak: number;
  attributes: Attributes;
  equippedItems: ShopItem[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  icon: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  item: ShopItem;
  quantity: number;
  equipped: boolean;
  purchasedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: string;
  xpReward: number;
  goldReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  message: string;
  xpGained: number;
  goldGained: number;
  createdAt: string;
}

export interface CompleteQuestResult {
  quest: Quest;
  xpGained: number;
  goldGained: number;
  attributeGained: Attributes;
  leveledUp: boolean;
  levelsGained: number;
  beforeLevel: number;
  afterLevel: number;
  user: User & { xpIntoLevel: number; xpForNextLevel: number };
  newAchievements: Achievement[];
}
