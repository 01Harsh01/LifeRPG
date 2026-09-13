import { Camera, Backpack } from "lucide-react";
import { Link } from "react-router-dom";
import { XPBar } from "./XPBar";
import { GoldCounter } from "./GoldCounter";
import { StreakBadge } from "./StreakCard";
import { UserAvatar } from "./UserAvatar";
import type { User, ShopItem } from "../types";

export function CharacterCard({
  user,
  xpIntoLevel,
  xpForNextLevel,
  equippedItems = [],
  onEditAvatar,
}: {
  user: User;
  xpIntoLevel: number;
  xpForNextLevel: number;
  equippedItems?: ShopItem[];
  onEditAvatar?: () => void;
}) {
  const avatarItem = equippedItems.find((i) => i.type === "Avatar");
  const titleItem = equippedItems.find((i) => i.type === "Title");
  const frameItem = equippedItems.find((i) => i.type === "Frame");
  const badgeItem = equippedItems.find((i) => i.type === "Badge");
  const weaponItem = equippedItems.find((i) => i.type === "Weapon");
  const armorItem = equippedItems.find((i) => i.type === "Armor");
  const cosmeticItem = equippedItems.find((i) => i.type === "Cosmetic");
  const themeItem = equippedItems.find((i) => i.type === "Theme");

  const hasGoldFrame = frameItem?.name.toLowerCase().includes("gold") || frameItem?.rarity === "Legendary";
  const hasPhoenixFrame = frameItem?.name.toLowerCase().includes("phoenix");
  const hasStarlight = cosmeticItem?.name.toLowerCase().includes("starlight");

  const frameClass = hasPhoenixFrame
    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-surface shadow-[0_0_20px_rgba(249,115,22,0.6)]"
    : hasGoldFrame
    ? "ring-2 ring-gold ring-offset-2 ring-offset-surface shadow-goldGlow"
    : "border border-white/10 shadow-glow";

  return (
    <div
      className={`card-glow p-6 relative overflow-hidden transition-all duration-300 ${
        hasStarlight ? "shadow-[0_0_25px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/40" : ""
      }`}
    >
      <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <UserAvatar
              avatarUrl={user.avatarUrl}
              name={user.name}
              size="lg"
              equippedAvatar={avatarItem}
              equippedFrame={frameItem}
              borderClass={frameClass}
            />
            {onEditAvatar && (
              <button
                type="button"
                onClick={onEditAvatar}
                title="Change Hero Portrait"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-arcane text-white hover:bg-gold hover:text-black border border-white/20 shadow-md transition transform group-hover:scale-110"
              >
                <Camera size={13} />
              </button>
            )}
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

      {/* Active Hero Loadout Rack */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
            <Backpack size={12} className="text-arcane" /> Loadout:
          </span>

          {weaponItem ? (
            <span
              title={`Equipped Weapon: ${weaponItem.name} (+75 Combat Power)`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-medium shadow-sm"
            >
              <span>{weaponItem.icon}</span>
              <span className="truncate max-w-[130px]">{weaponItem.name}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-lg border border-dashed border-white/10">
              🗡️ No Weapon
            </span>
          )}

          {armorItem ? (
            <span
              title={`Equipped Armor: ${armorItem.name} (+75 Combat Power)`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-medium shadow-sm"
            >
              <span>{armorItem.icon}</span>
              <span className="truncate max-w-[130px]">{armorItem.name}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-lg border border-dashed border-white/10">
              🛡️ No Armor
            </span>
          )}

          {cosmeticItem && (
            <span
              title={`Equipped Cosmetic: ${cosmeticItem.name}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-medium shadow-sm"
            >
              <span>{cosmeticItem.icon}</span>
              <span className="truncate max-w-[120px]">{cosmeticItem.name}</span>
            </span>
          )}

          {themeItem && (
            <span
              title={`Equipped Theme: ${themeItem.name}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium shadow-sm"
            >
              <span>{themeItem.icon}</span>
              <span className="truncate max-w-[120px]">{themeItem.name}</span>
            </span>
          )}
        </div>

        <Link
          to="/inventory"
          className="text-[11px] text-arcane hover:text-gold transition font-medium flex items-center gap-1 ml-auto"
          title="Manage Equipped Gear in Inventory"
        >
          Manage Bag &rarr;
        </Link>
      </div>
    </div>
  );
}
