import type { InventoryItem } from "../types";

export function InventoryCard({ item, onEquip }: { item: InventoryItem; onEquip: (id: string) => void }) {
  return (
    <div className={`card p-4 flex flex-col gap-3 ${item.equipped ? "border-gold/50 shadow-goldGlow" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{item.item.icon}</span>
        {item.quantity > 1 && <span className="text-xs text-slate-400">×{item.quantity}</span>}
      </div>
      <div>
        <h3 className="font-semibold text-sm">{item.item.name}</h3>
        <p className="text-xs text-slate-500">{item.item.type}</p>
      </div>
      <button
        onClick={() => onEquip(item.id)}
        className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition ${
          item.equipped ? "bg-gold/20 text-gold border border-gold/40" : "btn-secondary"
        }`}
      >
        {item.equipped ? "Equipped ✓" : "Equip"}
      </button>
    </div>
  );
}
