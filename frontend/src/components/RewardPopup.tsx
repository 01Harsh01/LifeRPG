import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { Attributes } from "../types";
import { playQuestCompleteSound } from "../utils/sound";

const ATTR_LABEL: Record<string, string> = {
  strength: "💪 Strength",
  intellect: "🧠 Intellect",
  discipline: "🔥 Discipline",
  vitality: "❤️ Vitality",
  creativity: "🎨 Creativity",
  social: "🤝 Social",
};

export function RewardPopup({
  show,
  xp,
  gold,
  attributes,
  onDone,
}: {
  show: boolean;
  xp: number;
  gold: number;
  attributes?: Attributes;
  onDone: () => void;
}) {
  const gainedAttr = attributes ? Object.entries(attributes).find(([, v]) => v > 0) : undefined;

  useEffect(() => {
    if (show) {
      playQuestCompleteSound();
      const timer = setTimeout(() => {
        onDone();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-40 card-glow px-5 py-4 flex items-center gap-4 bg-surface/95 border-arcane/40 shadow-2xl backdrop-blur-md rounded-2xl"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
          <div className="text-3xl animate-bounce">🎉</div>
          <div className="text-sm pr-2">
            <p className="font-semibold text-arcane text-base">+{xp} XP</p>
            <p className="font-semibold text-gold">+{gold} Gold</p>
            {gainedAttr && (
              <p className="text-xs text-slate-300 mt-0.5">
                +{gainedAttr[1]} {ATTR_LABEL[gainedAttr[0]]}
              </p>
            )}
          </div>
          <button
            onClick={onDone}
            aria-label="Dismiss rewards"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
