import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <h1 className="font-display text-2xl">Profile & Settings</h1>
      <div className="card p-6 space-y-4">
        <div>
          <p className="label">Name</p>
          <p className="text-slate-200">{user.name}</p>
        </div>
        <div>
          <p className="label">Email</p>
          <p className="text-slate-200">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">Level</p>
            <p className="font-display text-lg text-gold">{user.level}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-slate-500">Gold</p>
            <p className="font-display text-lg text-gold">{user.gold}</p>
          </div>
        </div>
      </div>
      <button
        onClick={async () => { await logout(); toast.push("Logged out.", "info"); navigate("/login"); }}
        className="btn-secondary w-full hover:bg-red-500/10 hover:text-red-300"
      >
        Log out
      </button>
    </div>
  );
}
