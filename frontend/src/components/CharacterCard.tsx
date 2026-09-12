import { XPBar } from "./XPBar";
import { GoldCounter } from "./GoldCounter";
import { StreakBadge } from "./StreakCard";
import type { User, ShopItem } from "../types";

export function CharacterCard({
  user,
  xpIntoLevel,
  xpForNextLevel,
  equippedItems = [],
}: {
  user: User;
  xpIntoLevel: number;
  xpForNextLevel: number;
  equippedItems?: ShopItem[];
}) {
  const avatarItem = equippedItems.find((i) => i.type === "Avatar");
  const titleItem = equippedItems.find((i) => i.type === "Title");
  const frameItem = equippedItems.find((i) => i.type === "Frame");
  const badgeItem = equippedItems.find((i) => i.type === "Badge");

  const hasGoldFrame = frameItem?.name.toLowerCase().includes("gold") || frameItem?.rarity === "Legendary";
  const hasPhoenixFrame = frameItem?.name.toLowerCase().includes("phoenix");

  const frameClass = hasPhoenixFrame
    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-surface shadow-[0_0_20px_rgba(249,115,22,0.6)]"
    : hasGoldFrame
    ? "ring-2 ring-gold ring-offset-2 ring-offset-surface shadow-goldGlow"
    : "border border-white/10 shadow-glow";

  return (
    <div className="card-glow p-6 relative overflow-hidden">
      <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div
            className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-arcane via-indigo-600 to-arcane2 flex items-center justify-center text-3xl font-display transition-all ${frameClass}`}
          >
            {avatarItem ? avatarItem.icon : user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Adventurer</span>
              {titleItem && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  {titleItem.name.replace(/"/g, "")}
                </span>
              )}
            </div>
            <h2 className="text-xl font-display font-semibold flex items-center gap-1.5 text-white">
              {user.name}
              {badgeItem && <span title={badgeItem.name} className="text-base">{badgeItem.icon}</span>}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge current={user.currentStreak ?? 0} />
          <GoldCounter value={user.gold} />
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-display text-gold font-semibold tracking-wide">LEVEL {user.level}</span>
          <span className="text-slate-400 tabular-nums font-mono text-xs">
            {xpIntoLevel} / {xpForNextLevel} XP
          </span>
        </div>
        <XPBar current={xpIntoLevel} max={xpForNextLevel} />
      </div>
    </div>
  );
}
