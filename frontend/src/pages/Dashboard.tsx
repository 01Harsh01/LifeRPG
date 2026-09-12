import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { api, ApiError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CharacterCard } from "../components/CharacterCard";
import { AttributeCard } from "../components/AttributeCard";
import { QuestCard } from "../components/QuestCard";
import { LevelUpModal } from "../components/LevelUpModal";
import { RewardPopup } from "../components/RewardPopup";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import type { Attributes, Character, Quest, ActivityLogEntry, CompleteQuestResult } from "../types";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<CompleteQuestResult | null>(null);
  const [reward, setReward] = useState<{ xp: number; gold: number; attrs: Attributes } | null>(null);

  async function loadAll() {
    const [charRes, questRes, actRes] = await Promise.all([
      api.get<{ character: Character }>("/character"),
      api.get<{ quests: Quest[] }>("/quests?status=active"),
      api.get<{ logs: ActivityLogEntry[] }>("/activity"),
    ]);
    setCharacter(charRes.character);
    setQuests(questRes.quests.slice(0, 5));
    setActivity(actRes.logs.slice(0, 5));
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  async function handleComplete(id: string) {
    const prevQuests = quests;
    setQuests((qs) => qs.map((q) => (q.id === id ? { ...q, completed: true } : q)));
    setCompletingId(id);
    try {
      const result = await api.post<CompleteQuestResult>(`/quests/${id}/complete`);
      setReward({ xp: result.xpGained, gold: result.goldGained, attrs: result.attributeGained });
      if (result.leveledUp) setLevelUp(result);
      if (result.newAchievements.length) {
        result.newAchievements.forEach((a) => toast.push(`Achievement unlocked — ${a.name}`, "success"));
      }
      await Promise.all([loadAll(), refreshUser()]);
    } catch (e) {
      setQuests(prevQuests);
      toast.push(e instanceof ApiError ? e.message : "Could not complete quest.", "error");
    } finally {
      setCompletingId(null);
    }
  }

  if (loading || !character || !user) return <PageSkeleton />;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      <CharacterCard
        user={{ ...user, gold: character.gold, level: character.level, currentStreak: character.currentStreak }}
        xpIntoLevel={character.xpIntoLevel}
        xpForNextLevel={character.xpForNextLevel}
        equippedItems={character.equippedItems}
      />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Attributes</h2>
          <span className="text-xs text-slate-400">Level up stats by completing matching quests</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(character.attributes)
            .filter(([k]) => k !== "id" && k !== "userId")
            .map(([key, value]) => (
              <AttributeCard key={key} name={key} value={value as number} />
            ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Active Quests</h2>
          <div className="flex items-center gap-3">
            <Link to="/quests" className="btn-primary text-xs py-1.5 px-3">
              + Quest Board
            </Link>
            <Link to="/quests" className="text-sm text-arcane hover:underline">
              View all
            </Link>
          </div>
        </div>
        {quests.length === 0 ? (
          <div className="card p-8 text-center space-y-3 border-dashed border-white/10">
            <p className="text-3xl">⚔️</p>
            <p className="text-sm text-slate-400">No active quests right now. Head to the Quest Board to embark on one!</p>
            <Link to="/quests" className="btn-primary inline-flex text-sm">
              Go to Quests
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {quests.map((q) => (
                <QuestCard key={q.id} quest={q} onComplete={handleComplete} completing={completingId === q.id} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Recent Chronicles</h2>
          <Link to="/history" className="text-sm text-arcane hover:underline">
            Full history
          </Link>
        </div>
        <div className="card divide-y divide-white/5">
          {activity.length === 0 && <p className="text-sm text-slate-500 p-4">No activity yet.</p>}
          {activity.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-300">{log.message}</span>
              <span className="text-xs text-slate-500 flex gap-2">
                {log.xpGained > 0 && <span className="text-arcane">+{log.xpGained} XP</span>}
                {log.goldGained !== 0 && (
                  <span className="text-gold">
                    {log.goldGained > 0 ? "+" : ""}
                    {log.goldGained} 🪙
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {reward && (
        <RewardPopup
          show={!!reward}
          xp={reward.xp}
          gold={reward.gold}
          attributes={reward.attrs}
          onDone={() => setReward(null)}
        />
      )}
      {levelUp && (
        <LevelUpModal
          open={!!levelUp}
          beforeLevel={levelUp.beforeLevel}
          afterLevel={levelUp.afterLevel}
          xpGained={levelUp.xpGained}
          goldGained={levelUp.goldGained}
          onClose={() => setLevelUp(null)}
        />
      )}
    </div>
  );
}
