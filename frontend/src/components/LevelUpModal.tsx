import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { playLevelUpSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";

export function LevelUpModal({
  open,
  beforeLevel,
  afterLevel,
  xpGained,
  goldGained,
  onClose,
}: {
  open: boolean;
  beforeLevel: number;
  afterLevel: number;
  xpGained: number;
  goldGained: number;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    playLevelUpSound();
    fireConfetti(90);
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Level up celebration"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative card-glow max-w-sm w-full p-8 text-center overflow-hidden border-2 border-gold/50 shadow-[0_0_50px_rgba(232,182,79,0.35)]"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -inset-16 bg-[radial-gradient(circle,rgba(232,182,79,0.25),rgba(139,92,246,0.15),transparent_70%)] pointer-events-none animate-pulse" />
            
            <div className="relative text-5xl mb-2 animate-bounce">👑</div>

            <motion.p
              className="relative text-xs tracking-[0.3em] text-gold font-bold uppercase"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              LEVEL UP ACHIEVED!
            </motion.p>
            <h2 className="relative font-display text-3xl font-bold mt-2 mb-5">
              Level {beforeLevel} <span className="text-gold">→</span> <span className="text-arcane">{afterLevel}</span>
            </h2>

            <div className="relative flex justify-center gap-6 text-sm bg-black/30 py-3 px-4 rounded-xl border border-white/5 mb-6">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">XP Gained</p>
                <p className="font-semibold text-arcane text-xl">+{xpGained}</p>
              </div>
              <div className="w-[1px] bg-white/10" />
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Gold Earned</p>
                <p className="font-semibold text-gold text-xl">+{goldGained}</p>
              </div>
            </div>

            <button
              ref={closeRef}
              onClick={onClose}
              className="btn-gold w-full text-base font-bold tracking-wide"
            >
              Claim Glory & Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
