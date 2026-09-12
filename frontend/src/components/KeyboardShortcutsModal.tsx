import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "N", desc: "Open New Quest modal" },
  { key: "D", desc: "Navigate to Dashboard" },
  { key: "Q", desc: "Navigate to Quest Log" },
  { key: "C", desc: "Navigate to Hero / Character" },
  { key: "S", desc: "Navigate to Shop" },
  { key: "M", desc: "Toggle sound effects on / off" },
  { key: "?", desc: "Toggle this Keyboard Shortcuts guide" },
  { key: "Esc", desc: "Close any modal or dialog" },
];

export function KeyboardShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="card-glow w-full max-w-md p-6 bg-surface/95 border-arcane/40 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <Keyboard size={18} className="text-gold" /> Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                aria-label="Close shortcuts"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5">
                  <span className="text-slate-300 text-xs">{s.desc}</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-semibold bg-white/10 text-gold rounded border border-white/10 shadow-sm">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-5">
              Use <kbd className="font-mono text-slate-400">Tab</kbd> and <kbd className="font-mono text-slate-400">Enter</kbd> to navigate interactive elements.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
