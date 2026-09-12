import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, Lock, Zap } from "lucide-react";
import { api, ApiError } from "../services/api";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { playLevelUpSound, playClickSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";
import type { SkillNode } from "../types";

export default function SkillTree() {
  const toast = useToast();
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [skillPoints, setSkillPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.get<{
        nodes: SkillNode[];
        skillPoints: number;
        userLevel: number;
      }>("/skills");
      setNodes(res.nodes);
      setSkillPoints(res.skillPoints);
      setUserLevel(res.userLevel);
    } catch {
      toast.push("Could not load skill tree.", "error");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnlock(node: SkillNode) {
    if (!node.canUnlock || unlockingKey) return;
    playClickSound();
    setUnlockingKey(node.key);
    try {
      await api.post("/skills/unlock", { skillKey: node.key });
      playLevelUpSound();
      fireConfetti(50);
      toast.push(`Unlocked perk: ${node.name}!`, "success");
      await load();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Unlock failed.", "error");
    } finally {
      setUnlockingKey(null);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gold uppercase tracking-widest">
            <Zap size={16} /> Talent & Perks
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
            Skill Tree
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spend Skill Points earned upon leveling up to unlock permanent passive bonuses
          </p>
        </div>
        <div className="card-glow px-4 py-2 flex items-center gap-2.5 border-gold/40">
          <Sparkles className="text-gold" size={18} />
          <div>
            <span className="text-xs text-slate-400 block">Available Points:</span>
            <span className="font-display text-lg font-bold text-gold">{skillPoints} SP</span>
          </div>
        </div>
      </div>

      {/* Perk Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {nodes.map((node) => {
          return (
            <motion.div
              key={node.key}
              layout
              className={`card p-5 flex flex-col justify-between transition border ${
                node.unlocked
                  ? "border-gold/50 bg-gold/5 shadow-goldGlow"
                  : node.canUnlock
                  ? "border-arcane shadow-glow hover:border-arcane/80"
                  : "border-white/5 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{node.icon}</span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {node.branch} • Tier {node.tier}
                      </span>
                      <h3 className="font-display text-base font-bold text-white mt-1">
                        {node.name}
                      </h3>
                    </div>
                  </div>
                  {node.unlocked ? (
                    <span className="text-xs font-bold text-gold px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 flex items-center gap-1">
                      <Check size={14} /> Mastered
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">
                      Cost: <strong className="text-gold font-bold">{node.cost} SP</strong>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mb-4">{node.description}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                {node.requires && !node.unlocked && (
                  <span className="text-[11px] text-slate-500 italic">
                    Requires: {nodes.find((n) => n.key === node.requires)?.name}
                  </span>
                )}
                {!node.requires && !node.unlocked && <span />}

                {node.unlocked ? (
                  <span className="text-xs text-emerald-400 font-medium">Active Perk ✓</span>
                ) : (
                  <button
                    disabled={!node.canUnlock || unlockingKey === node.key}
                    onClick={() => handleUnlock(node)}
                    className={
                      node.canUnlock
                        ? "btn-gold text-xs py-1.5 px-4 font-bold"
                        : "btn-secondary text-xs py-1.5 px-4 opacity-50 cursor-not-allowed"
                    }
                  >
                    {!node.canUnlock ? (
                      <span className="flex items-center gap-1">
                        <Lock size={12} /> Locked
                      </span>
                    ) : unlockingKey === node.key ? (
                      "Unlocking..."
                    ) : (
                      "Unlock Perk"
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card p-4 bg-black/20 text-center text-xs text-slate-400">
        💡 <strong className="text-slate-200">How to get Skill Points:</strong> Every time you level up your character by checking off real-world tasks, you gain +1 Skill Point to spend here!
      </div>
    </div>
  );
}
