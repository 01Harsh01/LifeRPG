import { useEffect, useState } from "react";
import { Sparkles, Camera, Backpack } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { CharacterCard } from "../components/CharacterCard";
import { AttributeCard } from "../components/AttributeCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { ProfilePictureModal } from "../components/ProfilePictureModal";
import type { Character as CharacterType } from "../types";

const RARITY_COLORS: Record<string, string> = {
  Common: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Rare: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Epic: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Legendary: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function Character() {
  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    api.get<{ character: CharacterType }>("/character").then((r) => setCharacter(r.character)).finally(() => setLoading(false));
  }, []);

  if (loading || !character) return <PageSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Character Sanctum</h1>
          <p className="text-xs text-slate-400 mt-0.5">Your hero progression, combat gear, attributes, and avatar portrait</p>
        </div>
        <button
          onClick={() => setAvatarModalOpen(true)}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
        >
          <Camera size={15} /> Change Hero Portrait
        </button>
      </div>

      <CharacterCard
        user={{
          id: character.id,
          name: character.name,
          email: "",
          avatarUrl: character.avatarUrl,
          level: character.level,
          gold: character.gold,
          xp: character.xp,
          currentStreak: character.currentStreak,
        }}
        xpIntoLevel={character.xpIntoLevel}
        xpForNextLevel={character.xpForNextLevel}
        equippedItems={character.equippedItems}
        onEditAvatar={() => setAvatarModalOpen(true)}
      />

      <ProfilePictureModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        equippedItems={character.equippedItems}
        onAvatarUpdated={(newAvatarUrl) => {
          setCharacter((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));
        }}
      />

      <section>
        <h2 className="font-display text-lg mb-3 flex items-center gap-2">
          <span>🧠</span> Attributes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(character.attributes).map(([key, value]) =>
            typeof value === "number" ? <AttributeCard key={key} name={key} value={value} /> : null
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg flex items-center gap-2 text-white">
            <span>🛡️</span> Equipped Armory & Gear
            <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-sans font-bold">
              {character.equippedItems.length} Active
            </span>
          </h2>
          <Link
            to="/inventory"
            className="text-xs text-arcane hover:text-gold transition font-medium flex items-center gap-1.5"
          >
            <Backpack size={14} /> Open Satchel & Equip &rarr;
          </Link>
        </div>

        {character.equippedItems.length === 0 ? (
          <div className="card p-8 text-center space-y-3 border-dashed border-white/10">
            <p className="text-3xl">🎒</p>
            <p className="text-sm text-slate-300 font-semibold">No Gear Equipped Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Visit the Grand Bazaar to purchase weapons, armor, frames, and titles, then equip them in your Satchel.
            </p>
            <div className="flex justify-center gap-2 pt-1">
              <Link to="/inventory" className="btn-secondary text-xs px-4 py-1.5">
                Go to Inventory
              </Link>
              <Link to="/shop" className="btn-primary text-xs px-4 py-1.5">
                Visit Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {character.equippedItems.map((item) => {
              const rarityStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
              return (
                <div
                  key={item.id}
                  className="card p-4 flex flex-col justify-between gap-3 border-gold/30 hover:border-gold/60 transition-all bg-surface/90 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl p-2 rounded-xl bg-black/30 border border-white/10">
                      {item.icon}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${rarityStyle}`}>
                      {item.rarity}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {item.type}
                    </span>
                    <p className="text-xs font-bold text-white truncate mt-0.5">{item.name}</p>
                    <p className="text-[10px] text-arcane font-mono mt-1">
                      {item.type === "Theme"
                        ? "Sanctum Palette"
                        : item.type === "Avatar"
                        ? "Portrait Skin"
                        : "+75 Combat Power"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
