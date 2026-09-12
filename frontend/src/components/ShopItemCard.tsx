import type { ShopItem } from "../types";

const RARITY_STYLES: Record<string, string> = {
  Common: "border-slate-500/30 text-slate-300",
  Rare: "border-blue-400/40 text-blue-300",
  Epic: "border-fuchsia-400/40 text-fuchsia-300",
  Legendary: "border-gold/50 text-gold shadow-goldGlow",
};

export function ShopItemCard({ item, owned, canAfford, onPurchase, purchasing }: {
  item: ShopItem; owned: boolean; canAfford: boolean; onPurchase: (id: string) => void; purchasing?: boolean;
}) {
  return (
    <div className={`card p-4 flex flex-col gap-3 border ${RARITY_STYLES[item.rarity]}`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{item.icon}</span>
        <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${RARITY_STYLES[item.rarity]}`}>
          {item.rarity}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-sm">{item.name}</h3>
        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-gold font-semibold text-sm">🪙 {item.price}</span>
        <button
          disabled={owned || !canAfford || purchasing}
          onClick={() => onPurchase(item.id)}
          className="btn-gold text-xs px-3 py-1.5"
        >
          {owned ? "Owned" : !canAfford ? "Not enough gold" : "Purchase"}
        </button>
      </div>
    </div>
  );
}
