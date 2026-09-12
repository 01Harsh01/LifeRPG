import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

export function ConfirmationModal({
  open, title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label={title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="card max-w-sm w-full p-6"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg mb-2">{title}</h3>
            <p className="text-sm text-slate-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
              <button
                ref={ref}
                onClick={onConfirm}
                className={`flex-1 rounded-xl px-5 py-2.5 font-semibold transition ${danger ? "bg-red-600 hover:bg-red-500 text-white" : "btn-primary"}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
