import { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sidebar, MobileNav } from "./Navigation";
import { PageSkeleton } from "./LoadingSkeleton";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { NetworkStatus } from "./NetworkStatus";
import { isSoundEnabled, setSoundEnabled, playClickSound } from "../utils/sound";
import { useToast } from "./Toast";
import { HelpCircle } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore key events when user is typing in inputs or textareas
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "d" && !e.ctrlKey && !e.metaKey) {
        navigate("/dashboard");
      } else if (e.key.toLowerCase() === "q" && !e.ctrlKey && !e.metaKey) {
        navigate("/quests");
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey) {
        navigate("/character");
      } else if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
        navigate("/shop");
      } else if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.metaKey) {
        const next = !isSoundEnabled();
        setSoundEnabled(next);
        if (next) playClickSound();
        toast.push(next ? "Sound enabled 🔊" : "Sound muted 🔇", "info");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, toast]);

  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen relative">
      <NetworkStatus />
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-8 relative">
        <Outlet />
      </main>
      <MobileNav />

      {/* Floating Keyboard Shortcuts Trigger */}
      <button
        onClick={() => setShortcutsOpen(true)}
        aria-label="Keyboard Shortcuts (Press ?)"
        title="Keyboard Shortcuts (Press ?)"
        className="hidden md:flex fixed bottom-4 right-4 z-30 p-2 rounded-full bg-surface/90 border border-white/10 text-slate-400 hover:text-gold hover:border-gold/40 shadow-lg transition-transform hover:scale-110"
      >
        <HelpCircle size={18} />
      </button>

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
