import { useEffect, useState } from "react";
import { api } from "../services/api";
import { PageSkeleton } from "../components/LoadingSkeleton";
import type { ActivityLogEntry } from "../types";

const FILTERS = ["All", "Quests", "XP", "Rewards", "Achievements", "Purchases"] as const;

const ACTION_ICON: Record<string, string> = {
  quest_completed: "⚔️", level_up: "🌟", achievement_unlocked: "🏆", purchase: "🛍️", attribute_gain: "📈",
};

export default function History() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<{ logs: ActivityLogEntry[] }>(`/activity?filter=${filter}`).then((r) => setLogs(r.logs)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <h1 className="font-display text-2xl mb-6">Activity History</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filter === f ? "bg-arcane/20 border-arcane/40 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
            {f}
          </button>
        ))}
      </div>
      {loading ? <PageSkeleton /> : logs.length === 0 ? (
        <p className="text-sm text-slate-500 card p-8 text-center">No activity in this filter yet.</p>
      ) : (
        <ol className="card divide-y divide-white/5">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="text-lg">{ACTION_ICON[log.action] || "•"}</span>
              <span className="flex-1 text-slate-300">{log.message}</span>
              <span className="text-xs text-slate-500 flex gap-2 shrink-0">
                {log.xpGained > 0 && <span className="text-arcane">+{log.xpGained} XP</span>}
                {log.goldGained !== 0 && <span className="text-gold">{log.goldGained > 0 ? "+" : ""}{log.goldGained} 🪙</span>}
                <span>{new Date(log.createdAt).toLocaleDateString()}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
