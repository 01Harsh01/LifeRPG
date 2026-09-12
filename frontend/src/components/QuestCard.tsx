import { motion } from "framer-motion";
import { Check, Pencil, Trash2, Clock } from "lucide-react";
import type { Quest } from "../types";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Medium: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  Hard: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  Epic: "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10",
};

export function QuestCard({
  quest, onComplete, onEdit, onDelete, completing,
}: {
  quest: Quest;
  onComplete?: (id: string) => void;
  onEdit?: (q: Quest) => void;
  onDelete?: (id: string) => void;
  completing?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: quest.completed ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={`card p-4 flex flex-col gap-3 ${quest.completed ? "" : "hover:border-arcane/40"} transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`font-semibold ${quest.completed ? "line-through text-slate-500" : ""}`}>{quest.title}</h3>
          {quest.description && <p className="text-sm text-slate-400 mt-0.5">{quest.description}</p>}
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full border ${DIFFICULTY_COLORS[quest.difficulty]}`}>
          {quest.difficulty}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="rounded-full bg-white/5 px-2 py-1">{quest.category}</span>
        <span className="text-arcane font-semibold">+{quest.xpReward} XP</span>
        <span className="text-gold font-semibold">+{quest.goldReward} 🪙</span>
        {quest.dueDate && (
          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(quest.dueDate).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        {!quest.completed && onComplete && (
          <button onClick={() => onComplete(quest.id)} disabled={completing} className="btn-primary flex-1 py-2 text-sm">
            <Check size={16} /> Complete Quest
          </button>
        )}
        {!quest.completed && onEdit && (
          <button aria-label="Edit quest" onClick={() => onEdit(quest)} className="btn-secondary p-2">
            <Pencil size={16} />
          </button>
        )}
        {onDelete && (
          <button aria-label="Delete quest" onClick={() => onDelete(quest.id)} className="btn-secondary p-2 hover:bg-red-500/10 hover:text-red-400">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
