import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Lock, CheckCircle2, ChevronRight, Compass } from "lucide-react";
import { api, ApiError } from "../services/api";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { playLevelUpSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";
import type { Character } from "../types";

interface Realm {
  id: number;
  name: string;
  subtitle: string;
  levelReq: number;
  icon: string;
  description: string;
  bounty: string;
}

const REALMS: Realm[] = [
  {
    id: 1,
    name: "The Sloth Mire",
    subtitle: "Chapter I: Breaking Inertia",
    levelReq: 1,
    icon: "🌲",
    description: "A murky bog where good intentions sink. Overcome inertia by logging your first daily quests.",
    bounty: "+100 Gold & Starter Trophy",
  },
  {
    id: 2,
    name: "Foothills of Focus",
    subtitle: "Chapter II: Consistency Trail",
    levelReq: 3,
    icon: "⛰️",
    description: "Steep rocky crags demanding daily diligence. Maintain streaks to summit the peaks.",
    bounty: "+250 Gold & Focused Wanderer Badge",
  },
  {
    id: 3,
    name: "Labyrinth of Habit",
    subtitle: "Chapter III: The Iron Routine",
    levelReq: 6,
    icon: "🏛️",
    description: "An ancient maze where productive habits become effortless instincts.",
    bounty: "+500 Gold & Labyrinth Key Frame",
  },
  {
    id: 4,
    name: "Citadel of Mastery",
    subtitle: "Chapter IV: Summit of Discipline",
    levelReq: 10,
    icon: "🏰",
    description: "A legendary stronghold guarded by the Titans of Distraction.",
    bounty: "+1000 Gold & Master's Crown Title",
  },
  {
    id: 5,
    name: "Astral Ascendance",
    subtitle: "Chapter V: Transcendent Mind",
    levelReq: 15,
    icon: "🌌",
    description: "The celestial plane where real-world mastery and virtual triumph unite.",
    bounty: "+2500 Gold & Astral Wings Cosmic Aura",
  },
];

export default function AdventureMap() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  async function load() {
    try {
      const res = await api.get<{ character: Character }>("/character");
      setCharacter(res.character);
    } catch {
      toast.push("Could not load realm map.", "error");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdvance() {
    if (!character || advancing) return;
    setAdvancing(true);
    try {
      await api.post("/character/advance-world");
      playLevelUpSound();
      fireConfetti(80);
      toast.push("Realm Conquered! Advanced to next chapter!", "success");
      await Promise.all([load(), refreshUser()]);
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Cannot advance yet.", "error");
    } finally {
      setAdvancing(false);
    }
  }

  if (loading || !character) return <PageSkeleton />;

  const currentWorld = character.adventureWorld || 1;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-arcane uppercase tracking-widest">
            <Compass size={16} /> World Expedition
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
            Chronicles of the Realm
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Progress through chapters as you level up your real-world character
          </p>
        </div>
        <div className="card px-4 py-2 border-arcane/30 flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400">Current Chapter:</span>
          <span className="text-arcane font-bold">World {currentWorld} of {REALMS.length}</span>
        </div>
      </div>

      {/* Realms Map Path */}
      <div className="space-y-4 relative">
        {REALMS.map((realm, idx) => {
          const isConquered = currentWorld > realm.id;
          const isCurrent = currentWorld === realm.id;
          const isLocked = currentWorld < realm.id;
          const canUnlock = isCurrent && character.level >= (REALMS[idx + 1]?.levelReq || 999);

          return (
            <motion.div
              key={realm.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`card p-5 md:p-6 transition border ${
                isCurrent
                  ? "border-arcane shadow-glow bg-arcane/5"
                  : isConquered
                  ? "border-emerald-500/30 bg-emerald-500/5 opacity-80"
                  : "border-white/5 opacity-50"
              }`}
            >
              <div className="flex items-start md:items-center justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                      isCurrent
                        ? "bg-arcane/20 border border-arcane shadow-glow"
                        : isConquered
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        : "bg-black/30 border border-white/5 grayscale"
                    }`}
                  >
                    {isLocked ? <Lock size={22} className="text-slate-500" /> : realm.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {realm.subtitle}
                      </span>
                      {isConquered && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Conquered
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-arcane/20 text-arcane flex items-center gap-1 animate-pulse">
                          <MapPin size={11} /> Active Questing
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mt-0.5">
                      {realm.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      {realm.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>Requirement: <strong className="text-gold">Level {realm.levelReq}</strong></span>
                      <span>•</span>
                      <span>Reward: <strong className="text-slate-200">{realm.bounty}</strong></span>
                    </div>
                  </div>
                </div>

                {isCurrent && idx < REALMS.length - 1 && (
                  <div className="w-full md:w-auto flex justify-end">
                    <button
                      onClick={handleAdvance}
                      disabled={advancing || character.level < REALMS[idx + 1].levelReq}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <span>Advance to Next Realm</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
