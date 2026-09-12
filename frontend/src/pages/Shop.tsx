import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import { ShopItemCard } from "../components/ShopItemCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { playCoinSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";
import type { InventoryItem, ShopItem } from "../types";

export default function Shop() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  async function load() {
    const [shopRes, invRes] = await Promise.all([
      api.get<{ items: ShopItem[] }>("/shop"),
      api.get<{ items: InventoryItem[] }>("/inventory"),
    ]);
    setItems(shopRes.items);
    setOwned(new Set(invRes.items.map((i) => i.itemId)));
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function handlePurchase(id: string) {
    setPurchasingId(id);
    try {
      await api.post(`/shop/${id}/purchase`);
      playCoinSound();
      fireConfetti(40);
      toast.push("Item purchased! Check your inventory.", "success");
      await Promise.all([load(), refreshUser()]);
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Purchase failed.", "error");
    } finally {
      setPurchasingId(null);
    }
  }

  if (loading || !user) return <PageSkeleton />;

  const grouped = items.reduce<Record<string, ShopItem[]>>((acc, item) => {
    (acc[item.type] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Shop</h1>
        <span className="text-gold font-semibold">🪙 {user.gold}</span>
      </div>
      {Object.entries(grouped).map(([type, groupItems]) => (
        <section key={type}>
          <h2 className="font-display text-lg mb-3">{type}s</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
      ))}
    </div>
  );
}
