import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";

interface ToastItem { id: number; message: string; kind: "error" | "success" | "info"; }
interface ToastContextValue { push: (message: string, kind?: ToastItem["kind"]) => void; }

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastItem["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ${
                t.kind === "error" ? "bg-red-950/90 border-red-500/40 text-red-200"
                : t.kind === "success" ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : "bg-surface border-white/10 text-slate-200"
              }`}
            >
              {t.kind === "error" ? "⚠️ " : t.kind === "success" ? "✅ " : ""}{t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
