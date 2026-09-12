import { useEffect, useState } from "react";
import { Store, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "../services/api";
import { ShopItemCard } from "../components/ShopItemCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { GoldCounter } from "../components/GoldCounter";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { playCoinSound, playLevelUpSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";
import type { InventoryItem, ShopItem } from "../types";

export default function Shop() {
  const { user, refreshUser, updateUserOptimistically } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  async function load() {
    const [shopRes, invRes] = await Promise.all([
      api.get<{ items: ShopItem[] }>("/shop"),
      api.get<{ items: InventoryItem[] }>("/inventory"),
    ]);
    setItems(shopRes.items);
    setOwned(new Set(invRes.items.map((i) => i.itemId)));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handlePurchase(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !user || user.gold < item.price) {
      toast.push("Not enough gold to acquire this item.", "error");
      return;
    }

    setPurchasingId(id);

    // Optimistic UI update: instantly deduct gold & mark as owned
    const prevGold = user.gold;
    const prevOwned = new Set(owned);

    updateUserOptimistically((prevUser) =>
      prevUser ? { ...prevUser, gold: prevUser.gold - item.price } : null
    );
    setOwned((prev) => new Set([...prev, id]));

    playCoinSound();
    fireConfetti(45);

    try {
      await api.post(`/shop/${id}/purchase`);
      toast.push(`Acquired ${item.name}! Added to your inventory.`, "success");
      await Promise.all([load(), refreshUser()]);
    } catch (e) {
      // Rollback optimistic changes on error
      updateUserOptimistically((prevUser) =>
        prevUser ? { ...prevUser, gold: prevGold } : null
      );
      setOwned(prevOwned);
      toast.push(e instanceof ApiError ? e.message : "Purchase failed.", "error");
    } finally {
      setPurchasingId(null);
    }
  }

  if (loading || !user) return <PageSkeleton />;

  const itemTypes = ["All", ...Array.from(new Set(items.map((i) => i.type)))];

  const filteredItems =
    activeCategory === "All"
      ? items
      : items.filter((i) => i.type === activeCategory);

  const grouped = filteredItems.reduce<Record<string, ShopItem[]>>((acc, item) => {
    (acc[item.type] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-black/5 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <Store size={22} />
            <span className="text-xs uppercase font-bold tracking-widest text-arcane">
              Grand Bazaar
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Merchant's Emporium
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exchange your quest spoils for heroic avatars, legendary frames, titles, and themes
          </p>
        </div>

        {/* Live Gold Counter Banner */}
        <div className="card px-5 py-3 flex items-center gap-3 bg-gold/10 border-gold/40 shadow-goldGlow">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              Treasury Balance
            </p>
            <div className="text-lg sm:text-xl font-bold">
              <GoldCounter value={user.gold} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {itemTypes.map((type) => {
          const isSelected = activeCategory === type;
          return (
            <button
              key={type}
              onClick={() => setActiveCategory(type)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-gold text-black shadow-goldGlow font-bold"
                  : "card hover:border-gold/40 text-slate-400 hover:text-white"
              }`}
            >
              {type === "All" ? "✨ All Treasures" : `${type}s`}
            </button>
          );
        })}
      </div>

      {/* Items Section by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card p-12 text-center text-slate-400 space-y-2">
          <p className="text-3xl">🏺</p>
          <p className="font-semibold text-sm">No items in this category yet.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, groupItems]) => (
          <section key={type} className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-white/5">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {type}s
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                ({groupItems.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={owned.has(item.id)}
                  canAfford={user.gold >= item.price}
                  purchasing={purchasingId === item.id}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
