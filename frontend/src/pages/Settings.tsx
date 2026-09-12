import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX, Sparkles, Keyboard, Moon, Sun, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useTheme, Theme } from "../context/ThemeContext";
import {
  isSoundEnabled,
  setSoundEnabled,
  playQuestCompleteSound,
  playLevelUpSound,
  playCoinSound,
  playClickSound,
} from "../utils/sound";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  if (!user) return null;

  function handleToggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
    toast.push(next ? "Audio effects active 🔊" : "Audio effects muted 🔇", "info");
  }

  const THEMES: { id: Theme; name: string; desc: string; icon: string }[] = [
    {
      id: "dark",
      name: "Dark Mode",
      desc: "Deep obsidian night theme with vibrant neon highlights and low glare.",
      icon: "🌙",
    },
    {
      id: "light",
      name: "Light Mode",
      desc: "Clean bright daytime theme with high-contrast text and crisp card outlines.",
      icon: "☀️",
    },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Hero's Sanctum & Settings</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Configure your game experience, audio, and visual theme</p>
      </div>

      {/* Profile Summary */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="h-12 w-12 rounded-xl bg-arcane/20 border border-arcane/40 flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{user.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center bg-black/5 dark:bg-black/20">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Level</p>
            <p className="font-display text-xl text-gold font-bold">{user.level}</p>
          </div>
          <div className="card p-3 text-center bg-black/5 dark:bg-black/20">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Gold</p>
            <p className="font-display text-xl text-gold font-bold">{user.gold} 🪙</p>
          </div>
          <div className="card p-3 text-center bg-black/5 dark:bg-black/20">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">Streak</p>
            <p className="font-display text-xl text-orange-500 dark:text-orange-400 font-bold">{user.currentStreak ?? 0} 🔥</p>
          </div>
        </div>
      </div>

      {/* Audio & Tactile FX */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {soundOn ? <Volume2 className="text-gold" size={20} /> : <VolumeX className="text-slate-400 dark:text-slate-500" size={20} />}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Audio & Procedural Sound FX</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Play celebratory sounds on quest completion, coin earnings, and level-ups</p>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              soundOn ? "bg-gold/20 text-gold border border-gold/40" : "btn-secondary text-slate-600 dark:text-slate-400"
            }`}
          >
            {soundOn ? "Enabled" : "Muted"}
          </button>
        </div>

        {soundOn && (
          <div className="pt-2 border-t border-black/5 dark:border-white/5">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Test Synthesized Sound Effects:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => playQuestCompleteSound()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                🔔 Quest Chime
              </button>
              <button
                onClick={() => playCoinSound()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                🪙 Coin Jingle
              </button>
              <button
                onClick={() => playLevelUpSound()}
                className="btn-secondary text-xs py-1.5 px-3 text-gold"
              >
                🎺 Level Up Fanfare
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Theme Selection - ONLY 2 THEMES: DARK MODE & LIGHT MODE */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-arcane" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Interface Visual Theme</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Select your display preference. Both themes are calibrated for crystal-clear text visibility and contrast.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  playClickSound();
                  toast.push(`Switched to ${t.name}!`, "success");
                }}
                className={`p-4 rounded-xl text-left transition border flex items-start gap-3.5 ${
                  isSelected
                    ? "border-arcane bg-arcane/10 shadow-glow ring-2 ring-arcane/40 font-bold"
                    : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-arcane/50"
                }`}
              >
                <div className="text-2xl p-2 rounded-lg bg-black/5 dark:bg-white/10 shrink-0">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-arcane text-white">
                        <Check size={10} /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {t.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessibility & Shortcuts */}
      <div className="card p-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Keyboard size={20} className="text-slate-600 dark:text-slate-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Keyboard Navigation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">View shortcuts for full keyboard accessibility</p>
          </div>
        </div>
        <button
          onClick={() => setShortcutsOpen(true)}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          View Keys (?)
        </button>
      </div>

      {/* Logout Action */}
      <button
        onClick={async () => {
          await logout();
          toast.push("Logged out safely.", "info");
          navigate("/login");
        }}
        className="btn-secondary w-full py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 border-red-500/30"
      >
        Log Out of Life RPG
      </button>

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
