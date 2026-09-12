import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, HelpCircle, Check, ShieldCheck, Gift } from "lucide-react";
import { api, ApiError } from "../services/api";
import { useToast } from "./Toast";
import { playCoinSound, playClickSound } from "../utils/sound";
import { fireConfetti } from "../utils/confetti";

interface WeeklyMilestone {
  week: string;
  weekNumber: number;
  startDay: number;
  endDay: number;
  activeDays: number;
  totalDays: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface StreakCalendarData {
  currentStreak: number;
  longestStreak: number;
  todayDate: number | null;
  isCurrentMonth: boolean;
  todayCompleted: boolean;
  streakFreezeActive: boolean;
  year: number;
  month: number;
  monthName: string;
  startDayOfWeek: number;
  daysInMonth: number;
  activeDays: number[];
  secondsUntilMidnight: number;
  daysLeftInWeek: number;
  currentWeekNumber: number;
  weeklyMilestones: WeeklyMilestone[];
  redeemableTokens: number;
}

export function StreakCalendarCard({ onStreakUpdated }: { onStreakUpdated?: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<StreakCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [redeeming, setRedeeming] = useState(false);
  const [showRules, setShowRules] = useState(false);

  async function fetchCalendar(offset: number) {
    try {
      const now = new Date();
      now.setMonth(now.getMonth() + offset);
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const res = await api.get<StreakCalendarData>(`/character/streak-calendar?year=${year}&month=${month}`);
      setData(res);
      if (offset === 0) {
        setSecondsLeft(res.secondsUntilMidnight);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCalendar(currentMonthOffset);
  }, [currentMonthOffset]);

  // Live countdown timer ticking down to midnight
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function formatCountdown(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleRedeem() {
    if (!data || data.redeemableTokens < 50) {
      toast.push("Earn at least 50 Streak Tokens to redeem bonus Gold & XP!", "info");
      return;
    }
    setRedeeming(true);
    playClickSound();
    try {
      const res = await api.post<{ success: boolean; message: string; remainingTokens: number }>("/character/streak-redeem");
      playCoinSound();
      fireConfetti();
      toast.push(res.message, "success");
      fetchCalendar(currentMonthOffset);
      if (onStreakUpdated) onStreakUpdated();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not redeem tokens.", "error");
    } finally {
      setRedeeming(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="card p-5 animate-pulse min-h-[360px] flex items-center justify-center">
        <span className="text-xs text-slate-400">Loading Streak Calendar...</span>
      </div>
    );
  }

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const daysArray = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: data.startDayOfWeek }, (_, i) => i);
  const activeDaysSet = new Set(data.activeDays);

  return (
    <div className="card p-5 relative overflow-hidden bg-[#181a20] dark:bg-[#12141a] border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl flex flex-col justify-between max-w-sm w-full mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Day {data.currentStreak > 0 ? data.currentStreak : 1}
              </h3>
              {data.isCurrentMonth && secondsLeft > 0 && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {formatCountdown(secondsLeft)} left
                </span>
              )}
            </div>
            {data.streakFreezeActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-500 dark:text-cyan-400 mt-0.5">
                <ShieldCheck size={11} /> Streak Freeze Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Month Cycling Controls */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10 p-0.5">
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentMonthOffset((prev) => prev - 1);
                }}
                className="p-1 hover:text-white text-slate-400 transition"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentMonthOffset((prev) => prev + 1);
                }}
                className="p-1 hover:text-white text-slate-400 transition"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Hexagonal Month Badge (LeetCode Style) */}
            <div className="relative flex items-center justify-center h-10 w-10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border border-purple-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)] rotate-45 transform" />
              <div className="relative z-10 text-center -space-y-0.5">
                <span className="block text-xs font-black text-white leading-none">
                  {data.month}
                </span>
                <span className="block text-[8px] font-bold text-purple-300 uppercase tracking-tight">
                  {data.monthName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Days of the Week Initials */}
        <div className="grid grid-cols-7 text-center mb-2">
          {weekdays.map((w, idx) => (
            <span
              key={idx}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center items-center justify-items-center mb-4">
          {/* Leading Blanks */}
          {leadingBlanks.map((_, i) => (
            <div key={`blank-${i}`} className="h-7 w-7" />
          ))}

          {/* Month Days */}
          {daysArray.map((day) => {
            const isCompleted = activeDaysSet.has(day);
            const isToday = data.isCurrentMonth && data.todayDate === day;

            // Scenario 1: Today's active day
            if (isToday) {
              return (
                <div
                  key={day}
                  className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/40 transition-transform scale-105"
                  title="Today"
                >
                  {isCompleted ? <Check size={14} className="stroke-[3]" /> : day}
                </div>
              );
            }

            // Scenario 2: Completed Past Days (Vibrant Blue Checkmark Circle)
            if (isCompleted) {
              return (
                <div
                  key={day}
                  className="h-7 w-7 rounded-full bg-blue-600/90 text-white flex items-center justify-center text-xs shadow-[0_0_8px_rgba(37,99,235,0.4)] ring-1 ring-blue-400/50"
                  title={`Day ${day} Completed!`}
                >
                  <Check size={13} className="stroke-[3]" />
                </div>
              );
            }

            // Scenario 3: Standard uncompleted or upcoming day
            return (
              <div
                key={day}
                className="h-7 w-7 flex items-center justify-center text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-200 transition"
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Milestone Container */}
      <div className="space-y-3">
        <div className="rounded-xl p-3 bg-amber-500/10 dark:bg-[#2a2216] border border-amber-500/30">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-500 dark:text-amber-400">
              <span>Weekly Milestones</span>
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="hover:text-amber-300 transition"
                title="View Milestone Rules"
              >
                <HelpCircle size={13} />
              </button>
            </div>
            <span className="text-[11px] text-amber-400/80 font-medium">
              {data.daysLeftInWeek} days left
            </span>
          </div>

          {/* W1 to W5 Badges Row */}
          <div className="flex items-center justify-between px-1">
            {data.weeklyMilestones.map((m) => {
              if (m.isCurrent) {
                return (
                  <div
                    key={m.week}
                    className="h-7 w-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-2 ring-amber-300"
                    title={`Current Week (${m.week}) - ${m.activeDays} active days`}
                  >
                    {m.week}
                  </div>
                );
              }

              if (m.isCompleted) {
                return (
                  <div
                    key={m.week}
                    className="text-xs font-bold text-amber-400 flex items-center gap-0.5"
                    title={`Completed ${m.week}!`}
                  >
                    <span>{m.week}</span>
                    <Check size={10} className="stroke-[3]" />
                  </div>
                );
              }

              return (
                <span
                  key={m.week}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-600"
                >
                  {m.week}
                </span>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer: Redeem & Rules */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
          <button
            onClick={handleRedeem}
            disabled={redeeming || data.redeemableTokens < 50}
            className={`flex items-center gap-1.5 font-bold transition px-2 py-1 rounded-lg ${
              data.redeemableTokens >= 50
                ? "text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                : "text-slate-400 cursor-not-allowed opacity-75"
            }`}
            title="Redeem 50 tokens for +75 Gold and +150 XP"
          >
            <div className="h-4 w-4 rounded bg-emerald-500 flex items-center justify-center text-white text-[10px]">
              <Check size={10} className="stroke-[3]" />
            </div>
            <span>
              {data.redeemableTokens} Redeem
            </span>
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="text-slate-400 hover:text-slate-200 transition font-medium hover:underline"
          >
            Rules
          </button>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card p-6 max-w-sm w-full space-y-4 bg-surface border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                🔥 Daily Streak & Rules
              </h4>
              <button
                onClick={() => setShowRules(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>
                <strong className="text-white">1. Daily Check-in:</strong> Complete at least one quest per calendar day to advance your streak.
              </p>
              <p>
                <strong className="text-white">2. Blue Checks & Green Today:</strong> Completed days turn into blue circular badges. Today is highlighted in vibrant green!
              </p>
              <p>
                <strong className="text-white">3. Weekly Milestones:</strong> Complete 3+ quests in a week to light up your milestone badge (W1–W5).
              </p>
              <p>
                <strong className="text-white">4. Streak Tokens:</strong> Maintain your streak to earn 10 tokens daily. Exchange 50 tokens for +75 🪙 Gold and +150 XP.
              </p>
              <p>
                <strong className="text-white">5. Streak Freeze Shield:</strong> Active shields prevent your streak from resetting if you miss a day.
              </p>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="btn-primary w-full text-xs py-2 mt-2"
            >
              Got it, Hero!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
