import { motion } from "framer-motion";
import { Check, ShoppingBag, Sparkles, RefreshCw } from "lucide-react";
import type { ShopItem } from "../types";
import { playClickSound } from "../utils/sound";

const RARITY_STYLES: Record<string, { badge: string; border: string; glow: string }> = {
  Common: {
    badge: "border-slate-500/40 text-slate-300 bg-slate-500/10",
    border: "border-slate-700/60 hover:border-slate-500",
    glow: "",
  },
  Rare: {
    badge: "border-cyan-400/40 text-cyan-300 bg-cyan-400/10",
    border: "border-cyan-500/40 hover:border-cyan-400",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.15)]",
  },
  Epic: {
    badge: "border-purple-400/40 text-purple-300 bg-purple-400/10",
    border: "border-purple-500/40 hover:border-purple-400",
    glow: "shadow-[0_0_20px_rgba(192,132,252,0.2)]",
  },
  Legendary: {
    badge: "border-gold/50 text-gold bg-gold/15",
    border: "border-gold/60 hover:border-gold",
    glow: "shadow-[0_0_25px_rgba(232,182,79,0.3)]",
  },
};

export function ShopItemCard({
  item,
  owned,
  canAfford,
  onPurchase,
  purchasing,
}: {
  item: ShopItem;
  owned: boolean;
  canAfford: boolean;
  onPurchase: (id: string) => void;
  purchasing?: boolean;
}) {
  const rarity = RARITY_STYLES[item.rarity] || RARITY_STYLES.Common;

  function handleClick() {
    if (owned || !canAfford || purchasing) return;
    playClickSound();
    onPurchase(item.id);
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className={`card p-4 sm:p-5 flex flex-col justify-between gap-3.5 border transition-all duration-300 relative overflow-hidden group ${
        rarity.border
      } ${rarity.glow} ${owned ? "bg-black/25 opacity-80" : "bg-surface/90 hover:bg-surface"}`}
    >
      {/* Top Header: Icon + Rarity Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-12 h-12 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-200">
          {item.icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rarity.badge}`}
          >
            {item.rarity}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{item.type}</span>
        </div>
      </div>

      {/* Item Details */}
      <div className="space-y-1">
        <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-gold transition-colors">
          {item.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Price & Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 mt-auto">
        <div className="flex items-center gap-1 font-display font-bold text-sm text-gold">
          <span>🪙</span>
          <span>{item.price}</span>
          <span className="text-[10px] font-normal text-slate-400 uppercase">Gold</span>
        </div>

        <motion.button
          type="button"
          whileTap={!owned && canAfford && !purchasing ? { scale: 0.95 } : {}}
          disabled={owned || !canAfford || purchasing}
          onClick={handleClick}
          className={`text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            owned
              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 cursor-default"
              : !canAfford
              ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
              : "btn-gold shadow-md hover:shadow-goldGlow"
          }`}
        >
          {purchasing ? (
            <>
              <RefreshCw size={13} className="animate-spin" /> Buying...
            </>
          ) : owned ? (
            <>
              <Check size={14} strokeWidth={3} /> Acquired
            </>
          ) : !canAfford ? (
            "Need Gold"
          ) : (
            <>
              <ShoppingBag size={13} /> Buy Item
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
