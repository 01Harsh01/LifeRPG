import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, ShieldAlert, Trophy, Sparkles, Flame } from "lucide-react";
import { api, ApiError } from "../services/api";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { playLevelUpSound, playCoinSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";
import type { Boss } from "../types";

export default function BossBattle() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [boss, setBoss] = useState<Boss | null>(null);
  const [defeatedCount, setDefeatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [damageNumber, setDamageNumber] = useState<number | null>(null);
  const [victory, setVictory] = useState<Boss | null>(null);

  async function load() {
    try {
      const res = await api.get<{ boss: Boss; defeatedCount: number }>("/boss/active");
      setBoss(res.boss);
      setDefeatedCount(res.defeatedCount);
    } catch {
      toast.push("Could not load boss battle data.", "error");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAttack() {
    if (!boss || attacking) return;
    setAttacking(true);
    const hitDamage = 35 + Math.floor(Math.random() * 25);
    setDamageNumber(hitDamage);

    try {
      const res = await api.post<{
        boss: Boss;
        damageDealt: number;
        defeated: boolean;
        goldAwarded: number;
        xpAwarded: number;
      }>("/boss/attack", { damage: hitDamage, source: "Hero Strike" });

      setBoss(res.boss);

      if (res.defeated) {
        setVictory(boss);
        playLevelUpSound();
        fireConfetti(100);
        toast.push(`VICTORY! You defeated ${boss.name}!`, "success");
        await Promise.all([load(), refreshUser()]);
      } else {
        playCoinSound();
      }
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Attack failed.", "error");
    } finally {
      setTimeout(() => setDamageNumber(null), 1000);
      setAttacking(false);
    }
  }

  if (loading || !boss) return <PageSkeleton />;

  const hpPct = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));
  const hpColor =
    hpPct > 50
      ? "from-emerald-500 to-teal-400"
      : hpPct > 20
      ? "from-amber-500 to-yellow-400"
      : "from-red-600 to-rose-500";

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-widest">
            <Flame size={16} /> World Raid Event
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
            Boss Battle Arena
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conquer your real-world to-dos and focus sessions to deal fatal damage to the boss
          </p>
        </div>
        <div className="card px-3.5 py-2 flex items-center gap-2 border-gold/30">
          <Trophy size={18} className="text-gold" />
          <span className="text-xs font-semibold">
            {defeatedCount} Boss{defeatedCount === 1 ? "" : "es"} Slain
          </span>
        </div>
      </div>

      {/* Main Boss Arena Card */}
      <div className="card-glow p-6 md:p-10 relative overflow-hidden text-center border-red-500/30">
        <div className="absolute -inset-20 bg-[radial-gradient(circle,rgba(239,68,68,0.15),transparent_70%)] pointer-events-none" />

        {/* Tier badge */}
        <div className="relative inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 mb-4">
          <ShieldAlert size={14} /> Tier {boss.tier} World Boss
        </div>

        {/* Animated Boss Figure */}
        <div className="relative my-2 inline-block">
          <motion.div
            animate={
              attacking
                ? { x: [-10, 10, -8, 8, 0], scale: [1, 0.9, 1.05, 1] }
                : { y: [0, -12, 0] }
            }
            transition={
              attacking
                ? { duration: 0.4 }
                : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }
            className="text-7xl md:text-8xl select-none drop-shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer"
            onClick={handleAttack}
          >
            {boss.icon}
          </motion.div>

          {/* Floating Damage Number */}
          <AnimatePresence>
            {damageNumber && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -60, scale: 1.4 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 right-0 font-display font-bold text-2xl text-yellow-400 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none"
              >
                -{damageNumber} DMG!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Boss Names */}
        <h2 className="relative font-display text-2xl md:text-3xl font-bold mt-2">
          {boss.name}
        </h2>
        <p className="relative text-xs text-slate-400 italic mb-6">"{boss.title}"</p>

        {/* Boss HP Bar */}
        <div className="relative max-w-lg mx-auto mb-6">
          <div className="flex justify-between text-xs font-semibold mb-1.5 px-1">
            <span className="text-red-400 flex items-center gap-1">
              <span>❤️</span> BOSS HEALTH
            </span>
            <span className="font-mono tabular-nums">
              {boss.currentHp} / {boss.maxHp} HP ({Math.round(hpPct)}%)
            </span>
          </div>
          <div className="h-4 rounded-full bg-black/50 border border-white/10 overflow-hidden p-0.5">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${hpColor} relative transition-all duration-500`}
              style={{ width: `${hpPct}%` }}
            >
              <div className="absolute inset-0 bg-white/25 animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Loot Drops Preview */}
        <div className="relative flex justify-center gap-6 max-w-sm mx-auto mb-6 py-2.5 px-4 rounded-xl bg-black/20 border border-white/5 text-xs">
          <div>
            <span className="text-slate-400">Bounty Reward:</span>
            <span className="text-gold font-bold ml-1.5">+{boss.goldReward} 🪙</span>
          </div>
          <div className="w-[1px] bg-white/10" />
          <div>
            <span className="text-slate-400">XP Bounty:</span>
            <span className="text-arcane font-bold ml-1.5">+{boss.xpReward} XP</span>
          </div>
          <div className="w-[1px] bg-white/10" />
          <div>
            <span className="text-slate-400">Skill Point:</span>
            <span className="text-emerald-400 font-bold ml-1.5">+1 SP</span>
          </div>
        </div>

        {/* Attack Controls */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={handleAttack}
            disabled={attacking || boss.currentHp <= 0}
            className="btn-primary w-full sm:w-auto py-3 px-8 text-base shadow-glow flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border-red-400/40"
          >
            <Swords size={20} />
            {attacking ? "Striking..." : "Strike With Willpower"}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          💡 <span className="text-slate-300">Passive Damage:</span> Every quest you check off and focus session you complete deals direct damage to this boss!
        </p>
      </div>

      {/* Victory Modal */}
      <AnimatePresence>
        {victory && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVictory(null)}
          >
            <motion.div
              className="card-glow max-w-sm w-full p-8 text-center border-2 border-gold/60 shadow-goldGlow"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-3 animate-bounce">🏆</div>
              <h2 className="font-display text-2xl font-bold text-gold mb-1">
                BOSS VANQUISHED!
              </h2>
              <p className="text-xs text-slate-300 mb-6">
                You have slain <span className="font-semibold text-white">{victory.name}</span>!
              </p>

              <div className="card p-4 bg-black/30 space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gold Plundered</span>
                  <span className="text-gold font-bold font-mono">+{victory.goldReward} 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">XP Gained</span>
                  <span className="text-arcane font-bold font-mono">+{victory.xpReward} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Skill Point</span>
                  <span className="text-emerald-400 font-bold font-mono">+1 SP</span>
                </div>
              </div>

              <button
                onClick={() => setVictory(null)}
                className="btn-gold w-full py-2.5 font-bold tracking-wide"
              >
                Claim Bounty & Advance
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
