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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import { isSoundEnabled, setSoundEnabled, playClickSound } from "../utils/sound";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quests", label: "Quests", icon: Swords },
  { to: "/character", label: "Character", icon: UserIcon },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/inventory", label: "Inventory", icon: Backpack },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
    toast.push(next ? "Sound effects enabled 🔊" : "Sound effects muted 🔇", "info");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/5 bg-surface/70 backdrop-blur-md h-screen sticky top-0 p-4">
      <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(232,182,79,0.5)]">⚔️</span>
          <div>
            <span className="font-display font-bold tracking-wider text-base text-white">LIFE RPG</span>
            <p className="text-[10px] text-arcane tracking-wider uppercase font-semibold">Hero's Journey</p>
          </div>
        </div>
        <button
          onClick={toggleSound}
          title={soundOn ? "Mute sounds" : "Enable sounds"}
          aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-gold hover:bg-white/5 transition"
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-arcane/25 to-arcane2/15 text-white border border-arcane/40 shadow-glow"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-3 border-t border-white/5 space-y-1">
        <button
          onClick={async () => {
            await logout();
            toast.push("Logged out. See you soon, adventurer!", "info");
            navigate("/login");
          }}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
    toast.push(next ? "Sound effects enabled 🔊" : "Sound effects muted 🔇", "info");
  }

  const primaryMobileItems = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/quests", label: "Quests", icon: Swords },
    { to: "/character", label: "Hero", icon: UserIcon },
    { to: "/shop", label: "Shop", icon: Store },
    { to: "/inventory", label: "Bag", icon: Backpack },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-lg border-t border-white/10 flex justify-around items-center py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        aria-label="Mobile navigation"
      >
        {primaryMobileItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                isActive ? "text-arcane font-bold" : "text-slate-400 hover:text-slate-200"
              }`
            }
          >
            <Icon size={19} /> {label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200"
        >
          <Menu size={19} /> More
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-surface border-t border-white/10 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-display text-base font-bold text-white">Menu & Tools</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NavLink
                to="/achievements"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-sm font-medium hover:border-arcane/40"
              >
                <Trophy size={18} className="text-gold" /> Achievements
              </NavLink>
              <NavLink
                to="/history"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-sm font-medium hover:border-arcane/40"
              >
                <History size={18} className="text-arcane" /> Chronicles
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMoreOpen(false)}
                className="card p-3 flex items-center gap-2.5 text-sm font-medium hover:border-arcane/40"
              >
                <Settings size={18} className="text-slate-300" /> Settings
              </NavLink>
              <button
                onClick={toggleSound}
                className="card p-3 flex items-center gap-2.5 text-sm font-medium text-left hover:border-gold/40"
              >
                {soundOn ? <Volume2 size={18} className="text-gold" /> : <VolumeX size={18} className="text-slate-500" />}
                {soundOn ? "Sound: On" : "Sound: Off"}
              </button>
            </div>

            <button
              onClick={async () => {
                setMoreOpen(false);
                await logout();
                toast.push("Logged out.", "info");
                navigate("/login");
              }}
              className="btn-secondary w-full text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
