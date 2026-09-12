const ATTR_META: Record<string, { icon: string; label: string; blurb: string; color: string }> = {
  strength: { icon: "💪", label: "Strength", blurb: "Physical training & fitness quests.", color: "from-red-500 to-orange-500" },
  intellect: { icon: "🧠", label: "Intellect", blurb: "Coding, studying & reading quests.", color: "from-blue-500 to-cyan-400" },
  discipline: { icon: "🔥", label: "Discipline", blurb: "Work & personal-routine quests.", color: "from-amber-500 to-yellow-400" },
  vitality: { icon: "❤️", label: "Vitality", blurb: "Health-focused quests.", color: "from-pink-500 to-rose-400" },
  creativity: { icon: "🎨", label: "Creativity", blurb: "Creative & artistic quests.", color: "from-purple-500 to-fuchsia-400" },
  social: { icon: "🤝", label: "Social", blurb: "Social & relationship quests.", color: "from-emerald-500 to-teal-400" },
};

export function AttributeCard({ name, value }: { name: string; value: number }) {
  const meta = ATTR_META[name] ?? { icon: "✨", label: name, blurb: "", color: "from-slate-500 to-slate-400" };
  const pct = Math.min(100, (value % 100));
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold flex items-center gap-1.5">
          <span>{meta.icon}</span> {meta.label}
        </span>
        <span className="text-sm tabular-nums text-slate-300 font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${meta.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500 mt-2">{meta.blurb}</p>
    </div>
  );
}
