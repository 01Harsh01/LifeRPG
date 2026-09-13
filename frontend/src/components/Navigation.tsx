import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Swords,
  User as UserIcon,
  Backpack,
  Store,
  Trophy,
  History,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Menu,
  X,
  Sun,
  Moon,
  Compass,
  Zap,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "./Toast";
import { isSoundEnabled, setSoundEnabled, playClickSound } from "../utils/sound";
import { UserAvatar } from "./UserAvatar";
import { computeLevelFromXp } from "../utils/xp";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quests", label: "Quest Log", icon: Swords },
  { to: "/boss", label: "Boss Battles", icon: ShieldAlert, badge: "Raid" },
  { to: "/focus", label: "Focus Chamber", icon: Flame },
  { to: "/adventure", label: "Adventure Map", icon: Compass },
  { to: "/skills", label: "Skill Tree", icon: Zap },
  { to: "/character", label: "Character", icon: UserIcon },
  { to: "/shop", label: "Shop Bazaar", icon: Store },
  { to: "/inventory", label: "Inventory", icon: Backpack },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/history", label: "Chronicles", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const heroLevel = user ? Math.max(user.level || 1, computeLevelFromXp(user.xp).level) : 1;
  const equippedAvatarItem = user?.equippedItems?.find((i) => i.type === "Avatar") || null;
  const equippedFrameItem = user?.equippedItems?.find((i) => i.type === "Frame") || null;
  const equippedTitleItem = user?.equippedItems?.find((i) => i.type === "Title") || null;

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
    toast.push(next ? "Sound effects enabled 🔊" : "Sound effects muted 🔇", "info");
  }

  function handleToggleMode() {
    playClickSound();
    toggleColorMode();
    toast.push(colorMode === "dark" ? "Switched to Bright / Light Mode ☀️" : "Switched to Fantasy Dark Mode 🌙", "info");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/5 bg-surface/80 backdrop-blur-md h-screen sticky top-0 p-4">
      {/* Brand & Theme/Sound Controls */}
      <div className="flex items-center justify-between px-2 py-2 mb-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(232,182,79,0.5)]">⚔️</span>
          <div>
            <span className="font-display font-bold tracking-wider text-base text-white">LIFE RPG</span>
            <p className="text-[10px] text-arcane tracking-wider uppercase font-semibold">Hero's Realm</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={handleToggleMode}
            title={colorMode === "dark" ? "Switch to Bright/Light mode" : "Switch to Dark mode"}
            aria-label={colorMode === "dark" ? "Switch to Bright/Light mode" : "Switch to Dark mode"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-gold hover:bg-white/5 transition"
          >
            {colorMode === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? "Mute sounds" : "Enable sounds"}
            aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-gold hover:bg-white/5 transition"
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto pr-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-arcane/25 to-arcane2/15 text-white border border-arcane/40 shadow-glow font-bold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Icon size={17} />
              <span>{label}</span>
            </div>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile Badge */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        {user && (
          <NavLink
            to="/character"
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-arcane/40 transition group"
            title="View Character Profile"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              name={user.name}
              size="sm"
              equippedAvatar={equippedAvatarItem}
              equippedFrame={equippedFrameItem}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate group-hover:text-gold transition">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {equippedTitleItem ? equippedTitleItem.name.replace(/"/g, "") : `Level ${heroLevel} Hero`}
              </p>
            </div>
          </NavLink>
        )}

        <button
          onClick={async () => {
            await logout();
            toast.push("Logged out. Safe travels, adventurer!", "info");
            navigate("/login");
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 w-full rounded-xl text-xs font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const heroLevel = user ? Math.max(user.level || 1, computeLevelFromXp(user.xp).level) : 1;
  const mobileEquippedAvatar = user?.equippedItems?.find((i) => i.type === "Avatar") || null;
  const mobileEquippedFrame = user?.equippedItems?.find((i) => i.type === "Frame") || null;
  const mobileEquippedTitle = user?.equippedItems?.find((i) => i.type === "Title") || null;

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
    toast.push(next ? "Sound effects enabled 🔊" : "Sound effects muted 🔇", "info");
  }

  function handleToggleMode() {
    playClickSound();
    toggleColorMode();
    toast.push(colorMode === "dark" ? "Switched to Light Mode ☀️" : "Switched to Dark Mode 🌙", "info");
  }

  const primaryMobileItems = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/quests", label: "Quests", icon: Swords },
    { to: "/boss", label: "Boss", icon: ShieldAlert },
    { to: "/focus", label: "Focus", icon: Flame },
    { to: "/character", label: "Hero", icon: UserIcon },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-white/10 px-3 py-2 flex items-center justify-around"
        aria-label="Mobile Navigation Bar"
      >
        {primaryMobileItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                isActive ? "text-gold font-bold scale-105" : "text-slate-400 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}

        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            moreOpen ? "text-gold font-bold scale-105" : "text-slate-400 hover:text-white"
          }`}
          aria-label="Open More Realm Menu"
        >
          <Menu size={18} /> More
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-surface border-t border-white/10 rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-display text-base font-bold text-white">Full Realm Menu</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <NavLink
                to="/character"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-arcane/40 transition"
              >
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  name={user.name}
                  size="md"
                  equippedAvatar={mobileEquippedAvatar}
                  equippedFrame={mobileEquippedFrame}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">
                    {mobileEquippedTitle ? mobileEquippedTitle.name.replace(/"/g, "") : `Level ${heroLevel} Adventurer`}
                  </p>
                </div>
              </NavLink>
            )}

            <div className="grid grid-cols-2 gap-2">
              <NavLink
                to="/adventure"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-arcane/40"
              >
                <Compass size={17} className="text-arcane" /> Adventure Map
              </NavLink>
              <NavLink
                to="/skills"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-gold/40"
              >
                <Zap size={17} className="text-gold" /> Skill Tree
              </NavLink>
              <NavLink
                to="/shop"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-gold/40"
              >
                <Store size={17} className="text-gold" /> Shop Bazaar
              </NavLink>
              <NavLink
                to="/inventory"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-arcane/40"
              >
                <Backpack size={17} className="text-arcane" /> Inventory
              </NavLink>
              <NavLink
                to="/achievements"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-gold/40"
              >
                <Trophy size={17} className="text-gold" /> Achievements
              </NavLink>
              <NavLink
                to="/history"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-arcane/40"
              >
                <History size={17} className="text-arcane" /> Chronicles
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium hover:border-arcane/40"
              >
                <Settings size={17} className="text-slate-300" /> Settings
              </NavLink>

              {/* Theme Toggle Button */}
              <button
                onClick={handleToggleMode}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium text-left hover:border-amber-400/40"
              >
                {colorMode === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
                <span>{colorMode === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              {/* Sound Toggle Button */}
              <button
                onClick={toggleSound}
                className="card p-3 flex items-center gap-2.5 text-xs font-medium text-left hover:border-gold/40"
              >
                {soundOn ? <Volume2 size={17} className="text-gold" /> : <VolumeX size={17} className="text-slate-500" />}
                <span>{soundOn ? "Sound: On" : "Sound: Off"}</span>
              </button>
            </div>

            <button
              onClick={async () => {
                setMoreOpen(false);
                await logout();
                toast.push("Logged out.", "info");
                navigate("/login");
              }}
              className="btn-secondary w-full text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 py-2.5"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
