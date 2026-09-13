import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Keyboard,
  Moon,
  Sun,
  Check,
  Camera,
  Image,
  Shield,
  Trash2,
  Edit3,
  Bell,
  CheckCheck,
  Clock,
  Flame,
  Swords,
  ShieldAlert,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useTheme, Theme } from "../context/ThemeContext";
import { api } from "../services/api";
import { UserAvatar } from "../components/UserAvatar";
import { ProfilePictureModal } from "../components/ProfilePictureModal";
import { RPG_AVATAR_PRESETS } from "../utils/avatarPresets";
import type { ShopItem, NotificationItem } from "../types";
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
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();

  const isNotificationsTab = searchParams.get("tab") === "notifications";
  const notificationsSectionRef = useRef<HTMLDivElement>(null);

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [equippedItems, setEquippedItems] = useState<ShopItem[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "reminders" | "milestones" | "rewards">("all");
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("liferpg_read_notifications");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    api
      .get<{ character: { equippedItems: ShopItem[] } }>("/character")
      .then((r) => setEquippedItems(r.character.equippedItems || []))
      .catch(() => {});

    setLoadingNotifications(true);
    api
      .get<{ notifications: NotificationItem[] }>("/notifications")
      .then((r) => setNotifications(r.notifications || []))
      .catch(() => {})
      .finally(() => setLoadingNotifications(false));
  }, []);

  useEffect(() => {
    if (isNotificationsTab && notificationsSectionRef.current) {
      setTimeout(() => {
        notificationsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [isNotificationsTab]);

  function markAllNotificationsRead() {
    playClickSound();
    const allIds = new Set([...readNotifIds, ...notifications.map((n) => n.id)]);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem("liferpg_read_notifications", JSON.stringify(Array.from(allIds)));
    } catch {}
    toast.push("All notifications marked as read! ✨", "success");
  }

  function markSingleNotificationRead(id: string) {
    if (readNotifIds.has(id)) return;
    const next = new Set(readNotifIds);
    next.add(id);
    setReadNotifIds(next);
    try {
      localStorage.setItem("liferpg_read_notifications", JSON.stringify(Array.from(next)));
    } catch {}
  }

  if (!user) return null;

  const equippedAvatarItem = equippedItems.find((i) => i.type === "Avatar") || null;

  async function handleQuickPresetSelect(icon: string) {
    playClickSound();
    try {
      await api.put("/character/avatar", { avatarUrl: icon });
      await refreshUser();
      playLevelUpSound();
      toast.push(`Switched portrait to ${icon}! ✨`, "success");
    } catch {
      toast.push("Could not update portrait.", "error");
    }
  }

  async function handleResetAvatar() {
    playClickSound();
    try {
      await api.put("/character/avatar", { avatarUrl: null });
      await refreshUser();
      toast.push("Profile picture reset to default.", "info");
    } catch {
      toast.push("Could not reset portrait.", "error");
    }
  }

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

  const unreadCount = notifications.filter((n) => !readNotifIds.has(n.id)).length;
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "reminders") return n.type === "reminder" || n.type === "streak";
    if (notifFilter === "milestones")
      return n.type === "level_up" || n.type === "quest" || n.type === "boss";
    if (notifFilter === "rewards") return n.type === "reward";
    return true;
  });

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Hero's Sanctum & Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Configure your game experience, audio, quest reminders, and hero identity
        </p>
      </div>

      {/* Profile Picture & Hero Portrait Section */}
      <div className="card p-6 space-y-5 border-arcane/30 shadow-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-arcane" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hero Portrait</h3>
          </div>
          <button
            onClick={() => setAvatarModalOpen(true)}
            className="text-xs font-semibold text-arcane hover:text-gold transition flex items-center gap-1"
          >
            <Edit3 size={13} /> Customize
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-black/30 border border-white/5 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setAvatarModalOpen(true)}>
              <UserAvatar
                avatarUrl={user.avatarUrl}
                name={user.name}
                size="lg"
                equippedAvatar={equippedAvatarItem}
              />
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={18} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {user.name}
                {user.avatarUrl && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-arcane/20 text-arcane border border-arcane/30">
                    Custom Portrait
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {user.avatarUrl
                  ? user.avatarUrl.startsWith("http")
                    ? "Custom Web Image"
                    : user.avatarUrl.startsWith("data:")
                    ? "Uploaded Photo"
                    : "Hero Icon Preset"
                  : equippedAvatarItem
                  ? `Equipped Shop Item: ${equippedAvatarItem.name}`
                  : "Default Initial Avatar"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <Image size={13} /> Change
            </button>
            {user.avatarUrl && (
              <button
                onClick={handleResetAvatar}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Reset to initial default"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Hero Presets Strip */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Quick Fantasy Class Presets
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {RPG_AVATAR_PRESETS.slice(0, 7).map((p) => {
              const isCurrent = user.avatarUrl === p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => handleQuickPresetSelect(p.icon)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                    isCurrent
                      ? "ring-2 ring-gold bg-gold/20 scale-105 shadow-goldGlow"
                      : "bg-white/5 hover:bg-white/15 border border-white/10 hover:border-gold/40"
                  }`}
                  title={`${p.label} (${p.category})`}
                >
                  {p.icon}
                </button>
              );
            })}
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="px-3 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 text-xs font-semibold text-slate-300 hover:text-gold transition flex items-center gap-1.5"
            >
              <Sparkles size={13} /> More ({RPG_AVATAR_PRESETS.length}+)
            </button>
          </div>
        </div>
      </div>

      {/* Profile Summary Stats */}
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
            <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Level
            </p>
            <p className="font-display text-xl text-gold font-bold">{user.level}</p>
          </div>
          <div className="card p-3 text-center bg-black/5 dark:bg-black/20">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Gold
            </p>
            <p className="font-display text-xl text-gold font-bold">{user.gold} 🪙</p>
          </div>
          <div className="card p-3 text-center bg-black/5 dark:bg-black/20">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Streak
            </p>
            <p className="font-display text-xl text-orange-500 dark:text-orange-400 font-bold">
              {user.currentStreak ?? 0} 🔥
            </p>
          </div>
        </div>
      </div>

      {/* Unified Notifications, Reminders & Audio Section */}
      <div
        ref={notificationsSectionRef}
        id="notifications"
        className={`card p-6 space-y-5 transition-all duration-300 ${
          isNotificationsTab ? "ring-2 ring-arcane shadow-glow border-arcane" : ""
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-black/5 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-arcane/15 text-arcane">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Notifications & Audio Dispatch
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-arcane text-white animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Manage audio fanfares, quest completion reminders, streak alerts, and realm updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
              >
                <CheckCheck size={13} /> Mark read
              </button>
            )}
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                soundOn
                  ? "bg-gold/20 text-gold border border-gold/40"
                  : "btn-secondary text-slate-600 dark:text-slate-400"
              }`}
            >
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {soundOn ? "Audio Active" : "Muted"}
            </button>
          </div>
        </div>

        {/* Audio Effects Testing */}
        {soundOn && (
          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 space-y-2">
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Test Synthesized Alert Sounds:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => playQuestCompleteSound()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                🔔 Quest Chime
              </button>
              <button onClick={() => playCoinSound()} className="btn-secondary text-xs py-1.5 px-3">
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

        {/* Active Reminders & Notifications Dispatch Feed */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Active Quest & Realm Alerts
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setNotifFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  notifFilter === "all"
                    ? "bg-arcane text-white font-bold"
                    : "text-slate-400 hover:text-white bg-black/5 dark:bg-white/5"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter("reminders")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  notifFilter === "reminders"
                    ? "bg-arcane text-white font-bold"
                    : "text-slate-400 hover:text-white bg-black/5 dark:bg-white/5"
                }`}
              >
                ⏰ Reminders (
                {notifications.filter((n) => n.type === "reminder" || n.type === "streak").length})
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter("milestones")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  notifFilter === "milestones"
                    ? "bg-arcane text-white font-bold"
                    : "text-slate-400 hover:text-white bg-black/5 dark:bg-white/5"
                }`}
              >
                🌟 Milestones
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter("rewards")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  notifFilter === "rewards"
                    ? "bg-arcane text-white font-bold"
                    : "text-slate-400 hover:text-white bg-black/5 dark:bg-white/5"
                }`}
              >
                🎁 Bounty
              </button>
            </div>
          </div>

          {/* List of active alerts */}
          {loadingNotifications ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading alerts...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 card border-dashed border-white/10">
              No notifications matching this filter.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
              {filteredNotifications.map((item) => {
                const isRead = readNotifIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => markSingleNotificationRead(item.id)}
                    className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 text-xs ${
                      item.priority === "urgent"
                        ? "border-red-500/40 bg-red-500/[0.04]"
                        : item.priority === "high"
                        ? "border-amber-500/40 bg-amber-500/[0.03]"
                        : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/[0.03]"
                    } ${!isRead ? "ring-1 ring-arcane/30" : "opacity-80"}`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-lg shrink-0 mt-0.5">
                        {item.type === "streak"
                          ? "🔥"
                          : item.type === "quest"
                          ? "⚔️"
                          : item.type === "level_up"
                          ? "🌟"
                          : item.type === "boss"
                          ? "🐉"
                          : item.type === "reward"
                          ? "🎁"
                          : "⏰"}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          {item.badge && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                              {item.badge}
                            </span>
                          )}
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-arcane animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {item.actionUrl && (
                      <Link
                        to={item.actionUrl}
                        onClick={() => markSingleNotificationRead(item.id)}
                        className="btn-primary text-[11px] px-2.5 py-1 shrink-0 flex items-center gap-1"
                      >
                        {item.actionLabel || "Go"} <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Theme Selection - ONLY 2 THEMES: DARK MODE & LIGHT MODE */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-arcane" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Interface Visual Theme
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Select your display preference. Both themes are calibrated for crystal-clear text
          visibility and contrast.
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Keyboard Navigation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              View shortcuts for full keyboard accessibility
            </p>
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
      <div className="pt-2">
        <button
          onClick={async () => {
            await logout();
            toast.push("Logged out successfully. Safe travels!", "info");
            navigate("/login");
          }}
          className="btn-danger w-full py-2.5 text-xs font-semibold"
        >
          Sign Out of Realm
        </button>
      </div>

      <ProfilePictureModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        equippedItems={equippedItems}
        onAvatarUpdated={() => refreshUser()}
      />

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
