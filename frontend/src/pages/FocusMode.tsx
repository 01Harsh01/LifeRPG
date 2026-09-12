import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Flame, Sparkles, Volume2, VolumeX, CheckCircle } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { playLevelUpSound, playQuestCompleteSound, isSoundEnabled, setSoundEnabled } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";

export default function FocusMode() {
  const { refreshUser } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<"focus25" | "focus50" | "break5">("focus25");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const intervalRef = useRef<number | null>(null);

  function setTimerMode(newMode: "focus25" | "focus50" | "break5") {
    setRunning(false);
    setMode(newMode);
    const secs = newMode === "focus25" ? 25 * 60 : newMode === "focus50" ? 50 * 60 : 5 * 60;
    setTotalSeconds(secs);
    setTimeLeft(secs);
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function handleCompleteSession() {
    setRunning(false);
    setSessionsCompleted((prev) => prev + 1);

    if (mode === "break5") {
      playQuestCompleteSound();
      toast.push("Rest period complete. Ready for battle!", "info");
      setTimerMode("focus25");
      return;
    }

    const xpEarned = mode === "focus50" ? 80 : 40;
    const goldEarned = mode === "focus50" ? 30 : 15;
    const bossDmg = mode === "focus50" ? 100 : 50;

    playLevelUpSound();
    fireConfetti(70);

    try {
      await api.post("/boss/attack", { damage: bossDmg, source: "Pomodoro Focus Chamber" });
      toast.push(`Focus Complete! +${xpEarned} XP, +${goldEarned} 🪙, dealt ${bossDmg} DMG to Boss!`, "success");
      await refreshUser();
    } catch {
      toast.push(`Focus Chamber Complete! +${xpEarned} XP!`, "success");
    }

    setTimerMode("break5");
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 text-center">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-arcane uppercase tracking-widest mb-1">
          <Flame size={16} /> Hyperfocus Sanctum
        </div>
        <h1 className="font-display text-3xl font-bold text-white">Focus Chamber</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Immerse yourself in uninterrupted deep work. Completing focus sessions rewards direct XP and strikes the World Boss!
        </p>
      </div>

      {/* Mode Selector */}
      <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10 gap-1">
        <button
          onClick={() => setTimerMode("focus25")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            mode === "focus25" ? "bg-arcane text-white shadow-glow" : "text-slate-400 hover:text-white"
          }`}
        >
          25m Pomodoro
        </button>
        <button
          onClick={() => setTimerMode("focus50")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            mode === "focus50" ? "bg-arcane text-white shadow-glow" : "text-slate-400 hover:text-white"
          }`}
        >
          50m Deep Work
        </button>
        <button
          onClick={() => setTimerMode("break5")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            mode === "break5" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          5m Rest
        </button>
      </div>

      {/* Big Circular Timer Dial */}
      <div className="card-glow p-8 md:p-12 max-w-sm mx-auto flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(139,92,246,0.15),transparent_70%)] pointer-events-none" />

        {/* Circular Progress Display */}
        <div className="relative w-56 h-56 rounded-full border-4 border-white/5 flex flex-col items-center justify-center shadow-inner">
          <div className="font-mono text-5xl md:text-6xl font-bold tracking-tighter text-white">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-2">
            {mode === "break5" ? "🌿 Meditation" : "⚔️ Questing Focus"}
          </span>

          {/* Glowing ring indication */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-arcane/60 pointer-events-none"
            animate={running ? { scale: [1, 1.02, 1], opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={() => setRunning((prev) => !prev)}
            className="btn-primary py-3 px-8 text-base shadow-glow flex items-center gap-2"
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? "Pause" : "Begin Focus"}
          </button>
          <button
            onClick={() => setTimerMode(mode)}
            title="Reset timer"
            className="btn-secondary p-3 text-slate-400 hover:text-white"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={toggleSound}
            title={soundOn ? "Mute audio" : "Enable audio"}
            className="btn-secondary p-3 text-slate-400 hover:text-gold"
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* Rewards & Stats Banner */}
      <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto text-xs">
        <div className="card p-3">
          <span className="text-slate-400 block">Focus Reward</span>
          <span className="text-arcane font-bold text-sm">+40 to +80 XP</span>
        </div>
        <div className="card p-3">
          <span className="text-slate-400 block">Boss Damage</span>
          <span className="text-red-400 font-bold text-sm">50-100 DMG</span>
        </div>
        <div className="card p-3">
          <span className="text-slate-400 block">Sessions Done</span>
          <span className="text-gold font-bold text-sm">{sessionsCompleted} Finished</span>
        </div>
      </div>
    </div>
  );
}
