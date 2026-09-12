import { useEffect, useState } from "react";
import { Gift, Clock, Zap } from "lucide-react";
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
        <span className="text-xs text-charcoal dark:text-powderBlue">Loading Mystic Vault...</span>
      </div>
    );
  }

  const rarityStyles = {
    Common: "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/30 text-ironGrey dark:text-aliceBlue",
    Rare: "border-powderBlue/40 dark:border-powderBlue/50 bg-sky-50 dark:bg-powderBlue/15 text-ironGrey dark:text-aliceBlue shadow-sm",
    Legendary: "border-powderBlue dark:border-aliceBlue bg-aliceBlue/40 dark:bg-powderBlue/25 text-ironGrey dark:text-aliceBlue shadow-md",
  };

  return (
    <div className="card p-5 border border-powderBlue/25 dark:border-powderBlue/20 bg-white dark:bg-[#1d2625] relative overflow-hidden flex flex-col justify-between space-y-3.5 shadow-sm hover:shadow-md transition">
      {/* Subtle ambient accent with user palette */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-powderBlue/15 dark:bg-powderBlue/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Combat Power Rating */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal dark:text-powderBlue flex items-center gap-1">
            <Gift size={12} className="text-charcoal dark:text-powderBlue" /> Daily Mystic Vault
          </span>
          <h3 className="font-display text-base font-bold text-ironGrey dark:text-aliceBlue mt-0.5">
            Daily Bounty Chest
          </h3>
        </div>

        {combatPower !== undefined && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-aliceBlue/40 dark:bg-charcoal/40 border border-powderBlue/40 dark:border-powderBlue/40 text-ironGrey dark:text-aliceBlue shadow-sm font-bold"
            title="Total Combat Power derived from Level, Attributes, Equipment, and Streak"
          >
            <Zap size={13} className="text-powderBlue dark:text-aliceBlue" />
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
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-black/40 font-bold">
                Claimed
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-ironGrey dark:text-aliceBlue">+{recentReward.goldGained} 🪙 Gold</span>
              <span className="text-charcoal dark:text-powderBlue">+{recentReward.xpGained} XP</span>
              {recentReward.attributeBonus && (
                <span className="text-powderBlue dark:text-aliceBlue">
                  +{recentReward.attributeBonus.val} {recentReward.attributeBonus.attr}
                </span>
              )}
            </div>
          </div>
        ) : status.canClaim ? (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-aliceBlue/30 dark:bg-charcoal/25 border border-powderBlue/30 dark:border-powderBlue/30">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl animate-bounce">🎁</span>
              <div>
                <p className="text-xs font-bold text-ironGrey dark:text-aliceBlue">Free Reward Ready!</p>
                <p className="text-[11px] text-charcoal dark:text-lavenderGrey">Contains Gold, XP & Stat buffs</p>
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
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl opacity-80">🧰</span>
              <div>
                <p className="text-xs font-bold text-ironGrey dark:text-slate-200">Chest Sealed for Today</p>
                <p className="text-[11px] text-charcoal dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock size={12} className="text-lavenderGrey" /> Next reset: {formatTime(secondsLeft)}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-charcoal dark:text-powderBlue bg-aliceBlue/40 dark:bg-powderBlue/15 px-2.5 py-1 rounded-lg border border-powderBlue/30 dark:border-powderBlue/30">
              Claimed ✔
            </span>
          </div>
        )}
      </div>

      {/* Footer info line */}
      <div className="flex items-center justify-between text-[11px] text-charcoal dark:text-lavenderGrey relative z-10 pt-1.5 border-t border-powderBlue/15 dark:border-white/5">
        <span>Resets daily at 00:00 UTC</span>
        <span className="text-ironGrey dark:text-aliceBlue font-bold">Up to +160 Gold & +300 XP</span>
      </div>
    </div>
  );
}
