import { useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import { InventoryCard } from "../components/InventoryCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import type { InventoryItem } from "../types";

export default function Inventory() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api.get<{ items: InventoryItem[] }>("/inventory");
    setItems(res.items);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function handleEquip(id: string) {
    try {
      await api.post(`/inventory/${id}/equip`);
      await load();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not equip item.", "error");
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <h1 className="font-display text-2xl mb-6">Inventory</h1>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 card p-8 text-center">Your inventory is empty. Visit the shop to buy cosmetic items!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => <InventoryCard key={item.id} item={item} onEquip={handleEquip} />)}
        </div>
      )}
    </div>
  );
}
