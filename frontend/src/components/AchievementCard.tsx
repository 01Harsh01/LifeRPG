import type { Achievement } from "../types";

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`card p-4 flex items-center gap-4 ${achievement.unlocked ? "border-gold/40" : "opacity-50 grayscale"}`}>
      <span className="text-3xl">{achievement.icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm">{achievement.name}</h3>
        <p className="text-xs text-slate-400">{achievement.description}</p>
        {achievement.unlocked ? (
          <p className="text-[11px] text-gold mt-1">Unlocked{achievement.unlockedAt ? ` · ${new Date(achievement.unlockedAt).toLocaleDateString()}` : ""}</p>
        ) : (
          <p className="text-[11px] text-slate-500 mt-1">Locked</p>
        )}
      </div>
    </div>
  );
}
