import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const shopItems = [
    { name: "Obsidian Theme", description: "A sleek dark theme with violet accents.", type: "Theme", price: 200, rarity: "Rare", icon: "🎨" },
    { name: "Crimson Abyss Theme", description: "A blazing dark theme with molten ruby accents.", type: "Theme", price: 250, rarity: "Rare", icon: "🔥" },
    { name: "Emerald Grove Theme", description: "A mystical dark theme with jade emerald aura.", type: "Theme", price: 250, rarity: "Rare", icon: "🌿" },
    { name: "Cyberpunk Neon Theme", description: "A high-octane synthwave theme with cyan & pink neon.", type: "Theme", price: 300, rarity: "Epic", icon: "⚡" },
    { name: "Golden Border Frame", description: "Wrap your avatar in a shimmering gold frame.", type: "Frame", price: 350, rarity: "Epic", icon: "🖼️" },
    { name: "Phoenix Frame", description: "An animated phoenix-themed frame.", type: "Frame", price: 750, rarity: "Legendary", icon: "🦅" },
    { name: "Dragon Avatar", description: "A fierce dragon avatar for true adventurers.", type: "Avatar", price: 500, rarity: "Epic", icon: "🐉" },
    { name: "Knight Avatar", description: "A noble knight avatar.", type: "Avatar", price: 150, rarity: "Common", icon: "🛡️" },
    { name: "Wizard Avatar", description: "A wise wizard avatar.", type: "Avatar", price: 150, rarity: "Common", icon: "🧙" },
    { name: "\"The Relentless\" Title", description: "Show off your dedication with this title.", type: "Title", price: 300, rarity: "Rare", icon: "🏷️" },
    { name: "\"Legendary Hero\" Title", description: "A title reserved for the most accomplished.", type: "Title", price: 1000, rarity: "Legendary", icon: "👑" },
    { name: "Fire Streak Badge", description: "A badge that glows when your streak is hot.", type: "Badge", price: 120, rarity: "Common", icon: "🔥" },
    { name: "Starlight Cosmetic", description: "A subtle starlight particle effect around your card.", type: "Cosmetic", price: 400, rarity: "Epic", icon: "✨" },
    { name: "Streak Freeze Charm", description: "Consumable charm that protects your streak from resetting on a missed day.", type: "Cosmetic", price: 100, rarity: "Common", icon: "🧊" },
    { name: "Rune Blade of Focus", description: "A mystical blade forged from deep concentration.", type: "Weapon", price: 350, rarity: "Epic", icon: "🗡️" },
    { name: "Excalibur of Discipline", description: "The legendary sword that cuts through procrastination.", type: "Weapon", price: 800, rarity: "Legendary", icon: "⚔️" },
    { name: "Aegis Plate of Habits", description: "Sturdy armor forged to weather any challenge.", type: "Armor", price: 400, rarity: "Epic", icon: "🛡️" },
    { name: "Cloak of the Night Scholar", description: "Silken midnight cloak woven with arcane runes.", type: "Armor", price: 250, rarity: "Rare", icon: "🧥" },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { id: item.name },
      update: {},
      create: { id: item.name, ...item },
    });
  }

  const achievements = [
    { id: "first_quest", name: "First Quest", description: "Complete your first quest.", requirement: "first_quest", icon: "🏆", xpReward: 25, goldReward: 10 },
    { id: "streak_7", name: "On Fire", description: "Reach a 7-day streak.", requirement: "streak_7", icon: "🔥", xpReward: 100, goldReward: 50 },
    { id: "quests_50", name: "Quest Master", description: "Complete 50 quests.", requirement: "quests_50", icon: "⚔️", xpReward: 300, goldReward: 150 },
    { id: "study_25", name: "Scholar", description: "Complete 25 study quests.", requirement: "study_25", icon: "🧠", xpReward: 200, goldReward: 100 },
    { id: "fitness_25", name: "Warrior", description: "Complete 25 fitness quests.", requirement: "fitness_25", icon: "💪", xpReward: 200, goldReward: 100 },
    { id: "gold_1000", name: "Wealthy Adventurer", description: "Accumulate 1,000 Gold.", requirement: "gold_1000", icon: "💰", xpReward: 150, goldReward: 0 },
    { id: "level_10", name: "Level 10", description: "Reach Level 10.", requirement: "level_10", icon: "🌟", xpReward: 0, goldReward: 200 },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
