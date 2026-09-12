import { motion } from "framer-motion";
import { Check, Pencil, Trash2, Clock, Sparkles, RefreshCw } from "lucide-react";
import type { Quest } from "../types";
import { playClickSound } from "../utils/sound";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Medium: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  Hard: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  Epic: "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10 shadow-[0_0_12px_rgba(217,70,239,0.2)]",
};

const CATEGORY_ICONS: Record<string, string> = {
  Coding: "💻",
  Study: "📚",
  Fitness: "🏋️",
  Health: "🥗",
  Work: "💼",
  Personal: "🎯",
  Reading: "📖",
  Creativity: "🎨",
  Social: "🤝",
  Custom: "✨",
};

export function QuestCard({
  quest,
  onComplete,
  onEdit,
  onDelete,
  completing,
}: {
  quest: Quest;
  onComplete?: (id: string) => void;
  onEdit?: (q: Quest) => void;
  onDelete?: (id: string) => void;
  completing?: boolean;
}) {
  function handleCheck() {
    if (quest.completed || completing || !onComplete) return;
    playClickSound();
    onComplete(quest.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: quest.completed ? 0.65 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      whileHover={!quest.completed ? { y: -2, transition: { duration: 0.15 } } : {}}
      className={`card p-4 sm:p-5 flex flex-col gap-3.5 transition-all relative overflow-hidden group ${
        quest.completed
          ? "bg-black/20 border-white/5 opacity-70"
          : "hover:border-arcane/50 hover:shadow-glow"
      }`}
    >
      {/* Top row: Checkbox + Title + Difficulty */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Tactile RPG Checkbox */}
          <motion.button
            type="button"
            disabled={quest.completed || completing}
            onClick={handleCheck}
            title={quest.completed ? "Quest Completed" : "Mark as Completed"}
            aria-label={quest.completed ? "Quest Completed" : "Complete Quest"}
            whileHover={!quest.completed ? { scale: 1.12 } : {}}
            whileTap={!quest.completed ? { scale: 0.88 } : {}}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 mt-0.5 flex items-center justify-center border transition-all duration-300 ${
              quest.completed
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : completing
                ? "bg-gold/20 border-gold text-gold animate-pulse"
                : "border-white/20 hover:border-gold hover:bg-gold/10 text-white/30 hover:text-gold"
            }`}
          >
            {completing ? (
              <RefreshCw size={14} className="animate-spin text-gold" />
            ) : quest.completed ? (
              <Check size={16} strokeWidth={3} />
            ) : (
              <Check size={14} className="opacity-0 group-hover:opacity-70 transition-opacity" strokeWidth={2.5} />
            )}
          </motion.button>

          <div className="min-w-0 flex-1">
            <h3
              className={`font-semibold text-sm sm:text-base transition-all leading-snug ${
                quest.completed ? "line-through text-slate-500 dark:text-slate-500" : "text-slate-900 dark:text-white"
              }`}
            >
              {quest.title}
            </h3>
            {quest.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {quest.description}
              </p>
            )}
          </div>
        </div>

        <span
          className={`shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            DIFFICULTY_COLORS[quest.difficulty] || "text-slate-400 border-slate-500"
          }`}
        >
          {quest.difficulty}
        </span>
      </div>

      {/* Badges / Rewards Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-lg bg-black/5 dark:bg-white/5 px-2.5 py-1 text-slate-600 dark:text-slate-300 font-medium">
          <span>{CATEGORY_ICONS[quest.category] || "⚔️"}</span> {quest.category}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-arcane/15 text-arcane border border-arcane/25 font-bold tabular-nums">
          <Sparkles size={12} /> +{quest.xpReward} XP
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold/15 text-gold border border-gold/30 font-bold tabular-nums">
          🪙 +{quest.goldReward} Gold
        </span>
        {quest.dueDate && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto font-mono">
            <Clock size={12} /> {new Date(quest.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
        {!quest.completed && onComplete && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleCheck}
            disabled={completing}
            className="btn-primary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            {completing ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Completing...
              </>
            ) : (
              <>
                <Check size={14} strokeWidth={3} /> Complete Quest
              </>
            )}
          </motion.button>
        )}
        {!quest.completed && onEdit && (
          <button
            type="button"
            aria-label="Edit quest"
            title="Edit Quest"
            onClick={() => onEdit(quest)}
            className="btn-secondary p-2 text-slate-400 hover:text-white"
          >
            <Pencil size={15} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            aria-label="Delete quest"
            title="Delete Quest"
            onClick={() => onDelete(quest.id)}
            className="btn-secondary p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
