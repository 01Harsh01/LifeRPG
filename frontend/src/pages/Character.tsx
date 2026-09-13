import { useEffect, useState } from "react";
import { Sparkles, Camera } from "lucide-react";
import { api } from "../services/api";
import { CharacterCard } from "../components/CharacterCard";
import { AttributeCard } from "../components/AttributeCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { ProfilePictureModal } from "../components/ProfilePictureModal";
import type { Character as CharacterType } from "../types";

export default function Character() {
  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    api.get<{ character: CharacterType }>("/character").then((r) => setCharacter(r.character)).finally(() => setLoading(false));
  }, []);

  if (loading || !character) return <PageSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl">Character</h1>
          <p className="text-xs text-slate-400 mt-0.5">Your hero progression, attributes, and avatar portrait</p>
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
        <h2 className="font-display text-lg mb-3">Attributes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(character.attributes).map(([key, value]) =>
            typeof value === "number" ? <AttributeCard key={key} name={key} value={value} /> : null
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg mb-3">Equipped</h2>
        {character.equippedItems.length === 0 ? (
          <p className="text-sm text-slate-500 card p-6 text-center">Nothing equipped yet. Visit the shop to buy cosmetics!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {character.equippedItems.map((item) => (
              <div key={item.id} className="card p-4 text-center border-gold/40">
                <p className="text-3xl mb-1">{item.icon}</p>
                <p className="text-xs font-medium">{item.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
