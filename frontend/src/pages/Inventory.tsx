import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import { InventoryCard } from "../components/InventoryCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useTheme } from "../context/ThemeContext";
import { playClickSound } from "../utils/sound";
import type { InventoryItem } from "../types";

export default function Inventory() {
  const toast = useToast();
  const { applyThemeFromItem, setTheme } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api.get<{ items: InventoryItem[] }>("/inventory");
    setItems(res.items);
    const equippedTheme = res.items.find((i) => i.equipped && i.item.type === "Theme");
    if (equippedTheme) {
      applyThemeFromItem(equippedTheme.item.name);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEquip(id: string) {
    playClickSound();
    try {
      const res = await api.post<{ item: InventoryItem }>(`/inventory/${id}/equip`);
      if (res.item.item.type === "Theme") {
        if (res.item.equipped) {
          applyThemeFromItem(res.item.item.name);
          toast.push(`Activated ${res.item.item.name}!`, "success");
        } else {
          setTheme("dark");
          toast.push("Reverted to Dark Theme.", "info");
        }
      } else {
        toast.push(res.item.equipped ? `Equipped ${res.item.item.name}!` : `Unequipped ${res.item.item.name}.`, "info");
      }
      await load();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not equip item.", "error");
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Adventurer's Pack</h1>
          <p className="text-xs text-slate-400 mt-0.5">Equip your hard-earned cosmetics, themes, and avatars</p>
        </div>
        <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center space-y-3 border-dashed border-white/10">
          <p className="text-4xl">🎒</p>
          <h3 className="font-display font-semibold text-base">Your Pack is Empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't own any items yet. Visit the Bazaar / Shop to acquire avatars, titles, and themes with gold!
          </p>
          <a href="/shop" className="btn-primary text-xs inline-flex mt-2">
            Visit Shop
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <InventoryCard key={item.id} item={item} onEquip={handleEquip} />
          ))}
        </div>
      )}
    </div>
  );
}
