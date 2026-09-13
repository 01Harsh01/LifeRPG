import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Clock,
  Flame,
  Swords,
  Trophy,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";
import { api } from "../services/api";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { useToast } from "../components/Toast";
import { playClickSound, playLevelUpSound } from "../utils/sound";
import type { NotificationItem } from "../types";

const LOCAL_STORAGE_READ_KEY = "liferpg_read_notifications";

function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds(ids: Set<string>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_READ_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage quota
  }
}

export default function Notifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "reminders" | "milestones" | "rewards">("all");
  const [readIds, setReadIds] = useState<Set<string>>(getReadNotificationIds);

  async function loadNotifications() {
    try {
      const res = await api.get<{
        notifications: NotificationItem[];
        totalCount: number;
        remindersCount: number;
      }>("/notifications");
      setNotifications(res.notifications || []);
    } catch {
      toast.push("Could not load notifications.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  function markAllAsRead() {
    playClickSound();
    const allIds = new Set([...readIds, ...notifications.map((n) => n.id)]);
    setReadIds(allIds);
    saveReadNotificationIds(allIds);
    toast.push("All notifications marked as read! ✨", "success");
  }

  function markSingleAsRead(id: string) {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveReadNotificationIds(next);
  }

  if (loading) return <PageSkeleton />;

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const remindersCount = notifications.filter(
    (n) => n.type === "reminder" || n.type === "streak"
  ).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === "reminders") return n.type === "reminder" || n.type === "streak";
    if (activeTab === "milestones")
      return n.type === "level_up" || n.type === "quest" || n.type === "boss";
    if (activeTab === "rewards") return n.type === "reward";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-black/5 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-arcane">
            <Bell size={22} className="animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-widest text-arcane">
              Realm Dispatch
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Notifications & Reminders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time quest reminders, streak warnings, boss alerts, and level progression
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <span className="card px-3.5 py-2 text-xs font-semibold text-slate-300 border-white/10">
            {unreadCount} Unread
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "all"
              ? "bg-arcane text-white shadow-glow font-bold"
              : "card hover:border-arcane/40 text-slate-400 hover:text-white"
          }`}
        >
          🔔 All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "reminders"
              ? "bg-arcane text-white shadow-glow font-bold"
              : "card hover:border-arcane/40 text-slate-400 hover:text-white"
          }`}
        >
          ⏰ Reminders & Quests ({remindersCount})
        </button>

        <button
          onClick={() => setActiveTab("milestones")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "milestones"
              ? "bg-arcane text-white shadow-glow font-bold"
              : "card hover:border-arcane/40 text-slate-400 hover:text-white"
          }`}
        >
          🌟 Milestones & Raids
        </button>

        <button
          onClick={() => setActiveTab("rewards")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "rewards"
              ? "bg-arcane text-white shadow-glow font-bold"
              : "card hover:border-arcane/40 text-slate-400 hover:text-white"
          }`}
        >
          🎁 Rewards & Bounty
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3 border-dashed border-white/10">
          <p className="text-4xl animate-bounce">📭</p>
          <h3 className="font-display font-semibold text-lg text-white">No Notifications Here</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You're all caught up! Complete quests or take on daily challenges to generate new achievements and updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isRead = readIds.has(item.id);

            const priorityBorder =
              item.priority === "urgent"
                ? "border-red-500/40 bg-red-500/[0.04]"
                : item.priority === "high"
                ? "border-amber-500/40 bg-amber-500/[0.03]"
                : "border-white/10 bg-surface/90";

            return (
              <div
                key={item.id}
                onClick={() => markSingleAsRead(item.id)}
                className={`card p-4 sm:p-5 transition-all duration-200 border flex flex-col sm:flex-row items-start justify-between gap-4 relative overflow-hidden ${priorityBorder} ${
                  !isRead ? "ring-1 ring-arcane/30" : "opacity-85"
                }`}
              >
                {!isRead && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-arcane animate-ping" />
                )}

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-xl shrink-0">
                    {item.type === "streak" ? (
                      <Flame size={20} className="text-orange-400" />
                    ) : item.type === "quest" ? (
                      <Swords size={20} className="text-blue-400" />
                    ) : item.type === "level_up" ? (
                      <Sparkles size={20} className="text-gold" />
                    ) : item.type === "boss" ? (
                      <ShieldAlert size={20} className="text-red-400" />
                    ) : item.type === "reward" ? (
                      <Trophy size={20} className="text-amber-400" />
                    ) : (
                      <Clock size={20} className="text-indigo-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      {item.badge && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          {item.badge}
                        </span>
                      )}
                      {item.priority === "urgent" && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono pt-1">
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {item.actionUrl && (
                  <div className="sm:self-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                    <Link
                      to={item.actionUrl}
                      onClick={() => markSingleAsRead(item.id)}
                      className="btn-primary text-xs flex items-center justify-center gap-1.5 px-3.5 py-2 w-full sm:w-auto"
                    >
                      {item.actionLabel || "View"} <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
