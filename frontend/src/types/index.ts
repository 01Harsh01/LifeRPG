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
  skillPoints?: number;
  currentStreak?: number;
  longestStreak?: number;
  streakFreezeActive?: boolean;
  adventureWorld?: number;
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
  skillPoints: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezeActive: boolean;
  adventureWorld: number;
  rankTitle: string;
  rankTier: string;
  attributes: Attributes;
  equippedItems: ShopItem[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: string; // Theme | Avatar | Frame | Badge | Title | Cosmetic | Weapon | Armor
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

export interface Boss {
  id: string;
  bossId: string;
  name: string;
  title: string;
  icon: string;
  maxHp: number;
  currentHp: number;
  goldReward: number;
  xpReward: number;
  defeated: boolean;
  tier: number;
}

export interface SkillNode {
  key: string;
  name: string;
  branch: string;
  description: string;
  icon: string;
  cost: number;
  tier: number;
  requires?: string;
  unlocked: boolean;
  canUnlock: boolean;
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
  user: User & { xpIntoLevel: number; xpForNextLevel: number; skillPoints: number };
  newAchievements: Achievement[];
}
