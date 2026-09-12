import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Flame,
  Compass,
  Zap,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Snowflake,
} from "lucide-react";
import { api, ApiError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CharacterCard } from "../components/CharacterCard";
import { StreakCalendarCard } from "../components/StreakCalendarCard";
import { AttributeCard } from "../components/AttributeCard";
import { QuestCard } from "../components/QuestCard";
import { LevelUpModal } from "../components/LevelUpModal";
import { RewardPopup } from "../components/RewardPopup";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { playCoinSound } from "../utils/sound";
import type {
  Attributes,
  Character,
  Quest,
  ActivityLogEntry,
  CompleteQuestResult,
  Boss,
} from "../types";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<CompleteQuestResult | null>(null);
  const [reward, setReward] = useState<{ xp: number; gold: number; attrs: Attributes } | null>(null);
  const [buyingFreeze, setBuyingFreeze] = useState(false);

  async function loadAll() {
    try {
      const [charRes, questRes, actRes, bossRes] = await Promise.all([
        api.get<{ character: Character }>("/character"),
        api.get<{ quests: Quest[] }>("/quests?status=active"),
        api.get<{ logs: ActivityLogEntry[] }>("/activity"),
        api.get<{ boss: Boss }>("/boss/active").catch(() => ({ boss: null })),
      ]);
      setCharacter(charRes.character);
      setQuests(questRes.quests.slice(0, 5));
      setActivity(actRes.logs.slice(0, 5));
      if (bossRes?.boss) setActiveBoss(bossRes.boss);
    } catch {
      // ignore
    }
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

  async function handleBuyStreakFreeze() {
    if (buyingFreeze) return;
    setBuyingFreeze(true);
    try {
      await api.post("/character/streak-freeze");
      playCoinSound();
      toast.push("Streak Freeze Activated! Your streak is protected from missed days.", "success");
      await Promise.all([loadAll(), refreshUser()]);
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not activate streak freeze.", "error");
    } finally {
      setBuyingFreeze(false);
    }
  }

  if (loading || !character || !user) return <PageSkeleton />;

  const bossHpPct = activeBoss ? Math.round((activeBoss.currentHp / activeBoss.maxHp) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Hero Character Card & LeetCode-style Streak Calendar Grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-gold tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles size={13} /> {character.rankTitle || "Novice Adventurer"} ({character.rankTier || "Tier I"})
            </span>
            <div className="flex items-center gap-2">
              {character.streakFreezeActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Snowflake size={12} /> Streak Protected
                </span>
              ) : (
                <button
                  onClick={handleBuyStreakFreeze}
                  disabled={buyingFreeze || character.gold < 100}
                  className="text-[11px] font-semibold text-slate-400 hover:text-gold flex items-center gap-1"
                  title="Spend 100 gold to protect your streak"
                >
                  <Snowflake size={12} /> {buyingFreeze ? "Protecting..." : "Freeze Streak (100 🪙)"}
                </button>
              )}
            </div>
          </div>

          <CharacterCard
            user={{
              ...user,
              gold: character.gold,
              level: character.level,
              currentStreak: character.currentStreak,
            }}
            xpIntoLevel={character.xpIntoLevel}
            xpForNextLevel={character.xpForNextLevel}
            equippedItems={character.equippedItems}
          />
        </div>

        {/* LeetCode-style Streak Calendar Card */}
        <div className="lg:col-span-1 flex justify-center">
          <StreakCalendarCard onStreakUpdated={loadAll} />
        </div>
      </div>

      {/* Quick RPG Hub & World Boss Banner */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* World Boss Mini-Card */}
        <div className="card p-5 border-red-500/30 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                {activeBoss?.icon || "👹"}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <ShieldAlert size={12} /> Active World Raid Boss
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {activeBoss?.name || "The Procrastination Behemoth"}
                </h3>
              </div>
            </div>
            <Link to="/boss" className="btn-primary text-xs py-1.5 px-3">
              Engage Boss ➔
            </Link>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Boss Health</span>
              <span className="font-mono text-xs font-bold text-red-400">
                {activeBoss?.currentHp || 0} / {activeBoss?.maxHp || 300} HP ({bossHpPct}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-500"
                style={{ width: `${bossHpPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              ⚔️ Your completed quests and focus sessions strike this boss automatically!
            </p>
          </div>
        </div>

        {/* Quick Travel Hub */}
        <div className="card p-5 flex flex-col justify-between space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Expedition Hub
          </span>
          <div className="space-y-2">
            <Link
              to="/focus"
              className="card p-2.5 flex items-center justify-between text-xs font-medium hover:border-arcane transition"
            >
              <span className="flex items-center gap-2">
                <Flame size={15} className="text-orange-400" /> Focus Chamber
              </span>
              <ChevronRight size={14} className="text-slate-500" />
            </Link>
            <Link
              to="/skills"
              className="card p-2.5 flex items-center justify-between text-xs font-medium hover:border-gold transition"
            >
              <span className="flex items-center gap-2">
                <Zap size={15} className="text-gold" /> Skill Tree
                {character.skillPoints > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-gold/20 text-gold font-bold text-[10px]">
                    +{character.skillPoints} SP
                  </span>
                )}
              </span>
              <ChevronRight size={14} className="text-slate-500" />
            </Link>
            <Link
              to="/adventure"
              className="card p-2.5 flex items-center justify-between text-xs font-medium hover:border-emerald-400 transition"
            >
              <span className="flex items-center gap-2">
                <Compass size={15} className="text-emerald-400" /> Adventure Map
              </span>
              <ChevronRight size={14} className="text-slate-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Six Character Attributes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Character Attributes</h2>
          <span className="text-xs text-slate-400">Trained dynamically by completing matching quests</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(character.attributes)
            .filter(([k]) => k !== "id" && k !== "userId")
            .map(([key, value]) => (
              <AttributeCard key={key} name={key} value={value as number} />
            ))}
        </div>
      </section>

      {/* Active Quests Board */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Active Quest Log</h2>
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
            <p className="text-sm text-slate-400">
              No active quests in your journal. Click below or go to Quests to add missions!
            </p>
            <Link to="/quests" className="btn-primary inline-flex text-sm">
              Open Quest Journal
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

      {/* Chronicles / Activity Log */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">Recent Chronicles</h2>
          <Link to="/history" className="text-sm text-arcane hover:underline">
            Full history
          </Link>
        </div>
        <div className="card divide-y divide-white/5">
          {activity.length === 0 && <p className="text-sm text-slate-500 p-4">No activity recorded yet.</p>}
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
