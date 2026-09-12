import { useEffect, useState } from "react";
import { Sparkles, Gift, Clock, Zap, Award, ChevronRight } from "lucide-react";
import { api, ApiError } from "../services/api";
import { useToast } from "./Toast";
import { playCoinSound, playLevelUpSound, playClickSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";

interface DailyBountyStatus {
  canClaim: boolean;
  secondsUntilNextClaim: number;
  lastClaimedAt: string | null;
}

interface ClaimResult {
  success: boolean;
  rarity: "Common" | "Rare" | "Legendary";
  goldGained: number;
  xpGained: number;
  attributeBonus: { attr: string; val: number } | null;
  message: string;
}

export function DailyMysteryChestCard({
  combatPower,
  onClaimed,
}: {
  combatPower?: number;
  onClaimed?: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<DailyBountyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [recentReward, setRecentReward] = useState<ClaimResult | null>(null);

  async function checkStatus() {
    try {
      const res = await api.get<DailyBountyStatus>("/character/daily-bounty");
      setStatus(res);
      setSecondsLeft(res.secondsUntilNextClaim);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
  }, []);

  // Countdown timer to next claim
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleClaim() {
    setClaiming(true);
    playClickSound();
    try {
      const res = await api.post<ClaimResult>("/character/daily-bounty");
      if (res.rarity === "Legendary") {
        playLevelUpSound();
      } else {
        playCoinSound();
      }
      fireConfetti();
      setRecentReward(res);
      toast.push(res.message, "success");
      await checkStatus();
      if (onClaimed) onClaimed();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not claim daily chest.", "error");
    } finally {
      setClaiming(false);
    }
  }

  if (loading || !status) {
    return (
      <div className="card p-5 animate-pulse min-h-[160px] flex items-center justify-center">
        <span className="text-xs text-slate-400">Loading Mystic Vault...</span>
      </div>
    );
  }

  const rarityStyles = {
    Common: "border-slate-500/40 bg-slate-500/10 text-slate-200",
    Rare: "border-blue-500/50 bg-blue-500/15 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    Legendary: "border-gold bg-gold/20 text-gold shadow-goldGlow animate-pulse",
  };

  return (
    <div className="card p-5 border border-purple-500/30 dark:border-purple-500/20 bg-gradient-to-br from-[#1c142b] via-[#12121e] to-[#0b0b14] relative overflow-hidden flex flex-col justify-between space-y-4">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Combat Power Rating */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Gift size={12} /> Daily Mystic Vault
          </span>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Daily Bounty Chest
          </h3>
        </div>

        {combatPower !== undefined && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-sm"
            title="Total Combat Power derived from Level, Attributes, Equipment, and Streak"
          >
            <Zap size={13} className="text-purple-400" />
            <span className="text-xs font-mono font-bold tracking-tight">
              {combatPower.toLocaleString()} CP
            </span>
          </div>
        )}
      </div>

      {/* Center Body: Reward Revealed OR Chest Claim Button */}
      <div className="relative z-10">
        {recentReward ? (
          <div className={`p-3.5 rounded-xl border ${rarityStyles[recentReward.rarity]} space-y-1.5 animate-in zoom-in-95`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span>🎉 {recentReward.rarity} Chest Opened!</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/30">Claimed</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-gold">+{recentReward.goldGained} 🪙 Gold</span>
              <span className="text-purple-300">+{recentReward.xpGained} XP</span>
              {recentReward.attributeBonus && (
                <span className="text-emerald-400">
                  +{recentReward.attributeBonus.val} {recentReward.attributeBonus.attr}
                </span>
              )}
            </div>
          </div>
        ) : status.canClaim ? (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-bounce">🎁</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Free Reward Ready!</p>
                <p className="text-[11px] text-slate-400">Contains Gold, XP & Stat buffs</p>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="btn-primary text-xs py-2 px-4 shadow-glow"
            >
              {claiming ? "Unlocking..." : "Unlock Chest ✨"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl opacity-75">🧰</span>
              <div>
                <p className="text-xs font-semibold text-slate-300">Chest Sealed for Today</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock size={11} /> Next reset: {formatTime(secondsLeft)}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              Claimed ✔
            </span>
          </div>
        )}
      </div>

      {/* Footer info line */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 relative z-10 pt-1 border-t border-black/5 dark:border-white/5">
        <span>Resets daily at 00:00 UTC</span>
        <span className="text-purple-400 font-medium">Up to +160 Gold & +300 XP</span>
      </div>
    </div>
  );
}
