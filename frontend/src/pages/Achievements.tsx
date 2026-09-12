import { useEffect, useState } from "react";
import { api } from "../services/api";
import { AchievementCard } from "../components/AchievementCard";
import { PageSkeleton } from "../components/LoadingSkeleton";
import type { Achievement } from "../types";

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ achievements: Achievement[] }>("/achievements").then((r) => setAchievements(r.achievements)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Achievements</h1>
        <span className="text-sm text-slate-400">{unlockedCount} / {achievements.length} unlocked</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {achievements.map((a) => <AchievementCard key={a.id} achievement={a} />)}
      </div>
    </div>
  );
}
