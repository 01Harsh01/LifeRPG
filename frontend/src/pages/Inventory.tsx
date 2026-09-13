import { useEffect, useState } from "react";
import { Backpack, Sparkles, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../services/api";
import { InventoryCard } from "../components/InventoryCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useTheme } from "../context/ThemeContext";
import { playClickSound, playLevelUpSound } from "../utils/sound";
import type { InventoryItem } from "../types";

export default function Inventory() {
  const toast = useToast();
  const { applyThemeFromItem, setTheme } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>("All");

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
  }, []);

  async function handleEquip(id: string) {
    playClickSound();
    const prevItems = [...items];
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const willEquip = !target.equipped;

    // Optimistic update
    setItems((curr) =>
      curr.map((item) => {
        if (item.id === id) {
          return { ...item, equipped: willEquip };
        }
        // Only one item of the same slot type (Avatar, Frame, Title, Theme) can be equipped at once
        if (
          willEquip &&
          item.item.type === target.item.type &&
          ["Avatar", "Frame", "Title", "Theme"].includes(target.item.type)
        ) {
          return { ...item, equipped: false };
        }
        return item;
      })
    );

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
        toast.push(
          res.item.equipped
            ? `Equipped ${res.item.item.name}!`
            : `Unequipped ${res.item.item.name}.`,
          "info"
        );
      }
      await load();
    } catch (e) {
      setItems(prevItems);
      toast.push(e instanceof ApiError ? e.message : "Could not equip item.", "error");
    }
  }

  if (loading) return <PageSkeleton />;

  const itemTypes = ["All", ...Array.from(new Set(items.map((i) => i.item.type)))];
  const filtered =
    activeType === "All" ? items : items.filter((i) => i.item.type === activeType);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-black/5 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-arcane">
            <Backpack size={22} />
            <span className="text-xs uppercase font-bold tracking-widest text-arcane">
              Adventurer's Satchel
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Hero's Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Equip cosmetics, legendary titles, frames, and sanctum themes
          </p>
        </div>

        <span className="card px-4 py-2 text-xs font-semibold text-slate-300 border-white/10">
          {items.length} {items.length === 1 ? "Artifact" : "Artifacts"} Owned
        </span>
      </div>

      {/* Filter Tabs */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {itemTypes.map((type) => {
            const isSelected = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-arcane text-white shadow-glow font-bold"
                    : "card hover:border-arcane/40 text-slate-400 hover:text-white"
                }`}
              >
                {type === "All" ? "🎒 All Items" : `${type}s`}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid or Empty State */}
      {items.length === 0 ? (
        <div className="card p-12 text-center space-y-4 border-dashed border-white/10 max-w-lg mx-auto">
          <p className="text-5xl animate-pulse">🎒</p>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-white">Your Pack is Empty</h3>
            <p className="text-xs text-slate-400">
              You haven't claimed any items yet. Complete quests to earn gold, then visit the Grand Bazaar!
            </p>
          </div>
          <Link to="/shop" className="btn-primary text-xs inline-flex items-center gap-2 px-6 py-2.5">
            <Sparkles size={14} /> Visit Grand Bazaar
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-slate-400 text-xs">
          No items match this category filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <InventoryCard key={item.id} item={item} onEquip={handleEquip} />
          ))}
        </div>
      )}
    </div>
  );
}
