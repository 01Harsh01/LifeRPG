import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, HelpCircle, Check, ShieldCheck } from "lucide-react";
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
        <span className="text-xs text-charcoal dark:text-powderBlue">Loading Streak Calendar...</span>
      </div>
    );
  }

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const daysArray = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: data.startDayOfWeek }, (_, i) => i);
  const activeDaysSet = new Set(data.activeDays);

  return (
    <div className="card p-5 relative overflow-hidden bg-white dark:bg-[#1d2625] border border-powderBlue/25 dark:border-powderBlue/20 shadow-sm hover:shadow-md rounded-2xl flex flex-col justify-between max-w-sm w-full mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-xl font-bold text-ironGrey dark:text-aliceBlue">
                Day {data.currentStreak > 0 ? data.currentStreak : 1}
              </h3>
              {data.isCurrentMonth && secondsLeft > 0 && (
                <span className="text-xs font-mono text-charcoal dark:text-powderBlue font-bold">
                  {formatCountdown(secondsLeft)} left
                </span>
              )}
            </div>
            {data.streakFreezeActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-charcoal dark:text-powderBlue mt-0.5">
                <ShieldCheck size={11} className="text-powderBlue" /> Streak Freeze Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Month Cycling Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-black/30 rounded-lg border border-powderBlue/25 dark:border-white/10 p-0.5">
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentMonthOffset((prev) => prev - 1);
                }}
                className="p-1 hover:text-ironGrey dark:hover:text-aliceBlue text-charcoal dark:text-slate-400 transition"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentMonthOffset((prev) => prev + 1);
                }}
                className="p-1 hover:text-ironGrey dark:hover:text-aliceBlue text-charcoal dark:text-slate-400 transition"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Hexagonal Month Badge (Paletted Style: ironGrey to charcoal to powderBlue) */}
            <div className="relative flex items-center justify-center h-10 w-10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ironGrey via-charcoal to-powderBlue border border-powderBlue/40 shadow-md rotate-45 transform" />
              <div className="relative z-10 text-center -space-y-0.5">
                <span className="block text-xs font-black text-aliceBlue leading-none">
                  {data.month}
                </span>
                <span className="block text-[8px] font-bold text-powderBlue uppercase tracking-tight">
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
              className="text-[11px] font-bold text-ironGrey dark:text-powderBlue"
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
                  className="h-7 w-7 rounded-full bg-powderBlue text-ironGrey flex items-center justify-center text-xs font-black shadow-[0_0_12px_rgba(148,176,218,0.6)] ring-2 ring-aliceBlue transition-transform scale-105"
                  title="Today"
                >
                  {isCompleted ? <Check size={14} className="stroke-[3]" /> : day}
                </div>
              );
            }

            // Scenario 2: Completed Past Days (Iron Grey & Powder Blue Circle)
            if (isCompleted) {
              return (
                <div
                  key={day}
                  className="h-7 w-7 rounded-full bg-ironGrey text-aliceBlue flex items-center justify-center text-xs shadow-sm ring-1 ring-powderBlue/40"
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
                className="h-7 w-7 flex items-center justify-center text-xs font-semibold text-ironGrey/80 dark:text-slate-300 hover:text-ironGrey dark:hover:text-aliceBlue transition"
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Milestone Container */}
      <div className="space-y-3">
        <div className="rounded-xl p-3 bg-aliceBlue/35 dark:bg-charcoal/30 border border-powderBlue/30 dark:border-powderBlue/25">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 font-bold text-ironGrey dark:text-aliceBlue">
              <span>Weekly Milestones</span>
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="hover:text-ironGrey dark:hover:text-white transition text-charcoal dark:text-powderBlue"
                title="View Milestone Rules"
              >
                <HelpCircle size={13} />
              </button>
            </div>
            <span className="text-[11px] text-charcoal dark:text-powderBlue font-bold">
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
                    className="h-7 w-7 rounded-full bg-powderBlue text-ironGrey font-black text-xs flex items-center justify-center shadow-md ring-2 ring-aliceBlue"
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
                    className="text-xs font-bold text-ironGrey dark:text-aliceBlue flex items-center gap-0.5"
                    title={`Completed ${m.week}!`}
                  >
                    <span>{m.week}</span>
                    <Check size={10} className="stroke-[3] text-powderBlue" />
                  </div>
                );
              }

              return (
                <span
                  key={m.week}
                  className="text-xs font-semibold text-charcoal/60 dark:text-lavenderGrey/70"
                >
                  {m.week}
                </span>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer: Redeem & Rules */}
        <div className="flex items-center justify-between pt-2 border-t border-powderBlue/20 dark:border-white/10 text-xs">
          <button
            onClick={handleRedeem}
            disabled={redeeming || data.redeemableTokens < 50}
            className={`flex items-center gap-1.5 font-bold transition px-2 py-1 rounded-lg ${
              data.redeemableTokens >= 50
                ? "text-ironGrey dark:text-aliceBlue bg-powderBlue/25 dark:bg-powderBlue/20 border border-powderBlue/40 hover:bg-powderBlue/35"
                : "text-charcoal/60 dark:text-lavenderGrey/70 cursor-not-allowed opacity-75"
            }`}
            title="Redeem 50 tokens for +75 Gold and +150 XP"
          >
            <div className="h-4 w-4 rounded bg-powderBlue flex items-center justify-center text-ironGrey text-[10px]">
              <Check size={10} className="stroke-[3]" />
            </div>
            <span>
              {data.redeemableTokens} Redeem
            </span>
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="text-charcoal dark:text-powderBlue hover:text-ironGrey dark:hover:text-aliceBlue transition font-bold hover:underline"
          >
            Rules
          </button>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card p-6 max-w-sm w-full space-y-4 bg-white dark:bg-[#1d2625] border border-powderBlue/30 dark:border-powderBlue/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-powderBlue/20 dark:border-white/10">
              <h4 className="font-display font-bold text-base text-ironGrey dark:text-aliceBlue flex items-center gap-2">
                🔥 Daily Streak & Rules
              </h4>
              <button
                onClick={() => setShowRules(false)}
                className="text-charcoal dark:text-slate-400 hover:text-ironGrey dark:hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-black/30"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-charcoal dark:text-slate-300 space-y-2.5 leading-relaxed font-medium">
              <p>
                <strong className="text-ironGrey dark:text-white font-bold">1. Daily Check-in:</strong> Complete at least one quest per calendar day to advance your streak.
              </p>
              <p>
                <strong className="text-ironGrey dark:text-white font-bold">2. Streak Badges:</strong> Completed days turn into iron-grey checkmark badges. Today is highlighted in glowing powder blue!
              </p>
              <p>
                <strong className="text-ironGrey dark:text-white font-bold">3. Weekly Milestones:</strong> Complete 3+ quests in a week to light up your milestone badge (W1–W5).
              </p>
              <p>
                <strong className="text-ironGrey dark:text-white font-bold">4. Streak Tokens:</strong> Maintain your streak to earn 10 tokens daily. Exchange 50 tokens for +75 🪙 Gold and +150 XP.
              </p>
              <p>
                <strong className="text-ironGrey dark:text-white font-bold">5. Streak Freeze Shield:</strong> Active shields prevent your streak from resetting if you miss a day.
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
