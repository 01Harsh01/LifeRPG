import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { InventoryItem } from "../types";

export function InventoryCard({
  item,
  onEquip,
}: {
  item: InventoryItem;
  onEquip: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`card p-4 sm:p-5 flex flex-col justify-between gap-3 border transition-all duration-300 relative overflow-hidden ${
        item.equipped
          ? "border-gold bg-gold/10 shadow-goldGlow ring-1 ring-gold/40"
          : "border-white/10 hover:border-arcane/40 bg-surface/90"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-12 h-12 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-3xl">
          {item.item.icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {item.item.type}
          </span>
          {item.quantity > 1 && (
            <span className="text-xs text-slate-400 font-mono font-semibold">×{item.quantity}</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
          {item.item.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
          {item.item.description}
        </p>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => onEquip(item.id)}
        className={`w-full py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 mt-2 ${
          item.equipped
            ? "bg-gold text-black shadow-goldGlow font-bold"
            : "btn-secondary hover:border-gold/40 hover:text-gold"
        }`}
      >
        {item.equipped ? (
          <>
            <Check size={14} strokeWidth={3} /> Equipped
          </>
        ) : (
          "Equip"
        )}
      </motion.button>
    </motion.div>
  );
}
