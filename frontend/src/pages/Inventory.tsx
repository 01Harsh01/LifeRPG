import { useEffect, useState } from "react";
import { Backpack, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../services/api";
import { InventoryCard } from "../components/InventoryCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "../components/UserAvatar";
import { playClickSound, playLevelUpSound } from "../utils/sound";
import type { InventoryItem } from "../types";

const RARITY_STYLES: Record<string, { badge: string; border: string }> = {
  Common: { badge: "bg-slate-500/20 text-slate-300 border-slate-500/30", border: "border-white/15" },
  Rare: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", border: "border-blue-500/40" },
  Epic: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", border: "border-purple-500/40" },
  Legendary: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]", border: "border-amber-500/50" },
};

const EQUIPMENT_SLOTS = [
  { type: "Weapon", label: "Main Weapon", defaultIcon: "⚔️", placeholder: "Empty Weapon Slot", desc: "Combat Power Boost" },
  { type: "Armor", label: "Body Armor", defaultIcon: "🛡️", placeholder: "Empty Armor Slot", desc: "Discipline & Defense" },
  { type: "Avatar", label: "Hero Skin", defaultIcon: "👤", placeholder: "Default Portrait", desc: "Profile Skin" },
  { type: "Frame", label: "Portrait Frame", defaultIcon: "🖼️", placeholder: "Standard Frame", desc: "Aura Border" },
  { type: "Title", label: "Honorific Title", defaultIcon: "🏷️", placeholder: "No Title Equipped", desc: "Display Prestige" },
  { type: "Badge", label: "Streak Badge", defaultIcon: "🔥", placeholder: "No Badge Active", desc: "Honor Insignia" },
  { type: "Theme", label: "Sanctum Theme", defaultIcon: "🎨", placeholder: "Dark Theme", desc: "Interface Palette" },
  { type: "Cosmetic", label: "Aura / Relic", defaultIcon: "✨", placeholder: "No Cosmetic Active", desc: "Visual Particles" },
];

export default function Inventory() {
  const toast = useToast();
  const { user, refreshUser } = useAuth();
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
        // Only one item of the same slot type can be equipped at once
        if (willEquip && item.item.type === target.item.type) {
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
        if (res.item.equipped) {
          playLevelUpSound();
        }
        toast.push(
          res.item.equipped
            ? `Equipped ${res.item.item.name}! Active on your Hero.`
            : `Unequipped ${res.item.item.name}.`,
          res.item.equipped ? "success" : "info"
        );
      }
      await load();
      await refreshUser();
    } catch (e) {
      setItems(prevItems);
      toast.push(e instanceof ApiError ? e.message : "Could not equip item.", "error");
    }
  }

  if (loading) return <PageSkeleton />;

  const equippedItemsList = items.filter((i) => i.equipped);
  const itemTypes = ["All", ...Array.from(new Set(items.map((i) => i.item.type)))];
  const filtered =
    activeType === "All" ? items : items.filter((i) => i.item.type === activeType);

  const equippedAvatarItem = items.find((i) => i.equipped && i.item.type === "Avatar")?.item || null;
  const equippedFrameItem = items.find((i) => i.equipped && i.item.type === "Frame")?.item || null;

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
            Hero's Inventory & Armory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Equip weapons, armor, cosmetics, legendary titles, frames, and sanctum themes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="card px-4 py-2 text-xs font-semibold text-slate-300 border-white/10">
            {items.length} {items.length === 1 ? "Artifact" : "Artifacts"} Owned
          </span>
          <Link to="/shop" className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2">
            <Sparkles size={14} /> Grand Bazaar
          </Link>
        </div>
      </div>

      {/* Active Hero Loadout & Equipment Rack */}
      <section className="card p-5 sm:p-6 space-y-4 border border-arcane/30 bg-surface/95 shadow-xl rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.name || "Hero"}
              size="md"
              equippedAvatar={equippedAvatarItem}
              equippedFrame={equippedFrameItem}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <span>🛡️</span> Active Hero Loadout
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  {equippedItemsList.length} / 8 Slots Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Equipped gear is immediately visible on your dashboard, profile, and navigation bar (+75 Combat Power per item).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-arcane/20 border border-arcane/40 text-arcane font-mono font-bold shadow-sm">
              +{equippedItemsList.length * 75} Combat Power
            </span>
          </div>
        </div>

        {/* 8 Equipment Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {EQUIPMENT_SLOTS.map((slot) => {
            const equipped = items.find((i) => i.equipped && i.item.type === slot.type);
            const style = equipped ? (RARITY_STYLES[equipped.item.rarity] || RARITY_STYLES.Common) : null;

            return (
              <div
                key={slot.type}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[125px] ${
                  equipped
                    ? `bg-white/[0.04] ${style?.border} shadow-md`
                    : "border-dashed border-white/10 bg-black/15 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold flex items-center gap-1">
                    <span>{slot.defaultIcon}</span> {slot.label}
                  </span>
                  {equipped && (
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${style?.badge}`}>
                      {equipped.item.rarity}
                    </span>
                  )}
                </div>

                <div className="my-2 flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                      equipped
                        ? "bg-black/40 border border-white/15 shadow-inner"
                        : "bg-white/5 border border-dashed border-white/10 text-slate-500 opacity-60"
                    }`}
                  >
                    {equipped ? equipped.item.icon : slot.defaultIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${equipped ? "text-white" : "text-slate-500"}`}>
                      {equipped ? equipped.item.name : slot.placeholder}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {equipped
                        ? (slot.type === "Theme"
                            ? "Active Theme"
                            : slot.type === "Avatar"
                            ? "Equipped Portrait"
                            : "+75 Combat Power")
                        : slot.desc}
                    </p>
                  </div>
                </div>

                {equipped ? (
                  <button
                    type="button"
                    onClick={() => handleEquip(equipped.id)}
                    className="w-full py-1 text-[11px] font-semibold rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition flex items-center justify-center gap-1"
                    title={`Unequip ${equipped.item.name}`}
                  >
                    Unequip
                  </button>
                ) : (
                  <span className="text-[10px] text-center text-slate-500 italic py-0.5">
                    Equip below ↓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
            <h3 className="font-display font-bold text-lg text-white">Your Satchel is Empty</h3>
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
