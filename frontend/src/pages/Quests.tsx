import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Search, Filter, Sparkles } from "lucide-react";
import { api, ApiError } from "../services/api";
import { QuestCard } from "../components/QuestCard";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { LevelUpModal } from "../components/LevelUpModal";
import { RewardPopup } from "../components/RewardPopup";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { fireConfetti } from "../utils/confetti";
import type { Attributes, Category, CompleteQuestResult, Difficulty, Quest } from "../types";

const CATEGORIES: Category[] = [
  "Coding",
  "Study",
  "Fitness",
  "Health",
  "Work",
  "Personal",
  "Reading",
  "Creativity",
  "Social",
  "Custom",
];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Epic"];
const REWARD_PREVIEW: Record<Difficulty, string> = {
  Easy: "+20 XP / +5 🪙",
  Medium: "+50 XP / +15 🪙",
  Hard: "+100 XP / +30 🪙",
  Epic: "+250 XP / +75 🪙",
};

function QuestFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: Quest | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState<Category>(initial?.category || "Personal");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty || "Easy");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setCategory(initial?.category || "Personal");
    setDifficulty(initial?.difficulty || "Easy");
    setDueDate(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.push("Quest title cannot be empty.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: cleanTitle,
        description: description.trim() || null,
        category,
        difficulty,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
      if (initial) await api.put(`/quests/${initial.id}`, payload);
      else await api.post("/quests", payload);
      toast.push(initial ? "Quest updated." : "Quest dispatched to your log.", "success");
      onSaved();
      onClose();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not save quest.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={initial ? "Edit quest" : "Create quest"}
            className="card-glow w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto bg-surface/95 rounded-t-3xl sm:rounded-2xl border-arcane/40 shadow-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <span>{initial ? "✏️" : "📜"}</span> {initial ? "Edit Quest" : "Create New Quest"}
              </h2>
              <button
                aria-label="Close"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="q-title" className="label">
                  Quest Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="q-title"
                  required
                  placeholder="e.g. Slay 3 LeetCode problems or Run 5km"
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="q-desc" className="label">
                  Objective Details (optional)
                </label>
                <textarea
                  id="q-desc"
                  placeholder="Notes, subtasks, or strategy..."
                  className="input"
                  rows={2}
                  value={description || ""}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="q-cat" className="label">
                    Category
                  </label>
                  <select
                    id="q-cat"
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="q-diff" className="label">
                    Difficulty
                  </label>
                  <select
                    id="q-diff"
                    className="input"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="card p-2.5 bg-arcane/10 border border-arcane/20 flex items-center justify-between text-xs">
                <span className="text-slate-300">Server Reward:</span>
                <span className="text-arcane font-bold font-mono">{REWARD_PREVIEW[difficulty]}</span>
              </div>
              <div>
                <label htmlFor="q-due" className="label">
                  Deadline (optional)
                </label>
                <input
                  id="q-due"
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                {submitting ? "Inscribing…" : initial ? "Save Changes" : "Embark on Quest"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Quests() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"active" | "completed">("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<CompleteQuestResult | null>(null);
  const [reward, setReward] = useState<{ xp: number; gold: number; attrs: Attributes } | null>(null);

  async function load() {
    const params = new URLSearchParams({ status: statusFilter });
    if (categoryFilter) params.set("category", categoryFilter);
    if (search) params.set("search", search);
    const res = await api.get<{ quests: Quest[] }>(`/quests?${params.toString()}`);
    setQuests(res.quests);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleComplete(id: string) {
    setCompletingId(id);
    const prev = quests;
    setQuests((qs) => qs.map((q) => (q.id === id ? { ...q, completed: true } : q)));
    try {
      const result = await api.post<CompleteQuestResult>(`/quests/${id}/complete`);
      fireConfetti(45);
      setReward({ xp: result.xpGained, gold: result.goldGained, attrs: result.attributeGained });
      if (result.leveledUp) setLevelUp(result);
      if (result.newAchievements.length) {
        result.newAchievements.forEach((a) => toast.push(`Achievement unlocked — ${a.name}`, "success"));
      }
      await Promise.all([load(), refreshUser()]);
    } catch (e) {
      setQuests(prev);
      toast.push(e instanceof ApiError ? e.message : "Could not complete quest.", "error");
    } finally {
      setCompletingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.del(`/quests/${deleteId}`);
      toast.push("Quest removed from journal.", "success");
      await load();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not delete quest.", "error");
    } finally {
      setDeleteId(null);
    }
  }

  const [generatingDaily, setGeneratingDaily] = useState(false);

  async function handleGenerateDaily() {
    if (generatingDaily) return;
    setGeneratingDaily(true);
    try {
      const res = await api.post<{ quests: Quest[] }>("/quests/generate-daily");
      fireConfetti(50);
      toast.push(`Generated ${res.quests.length} Daily RPG Quests!`, "success");
      await load();
    } catch (e) {
      toast.push(e instanceof ApiError ? e.message : "Could not generate quests.", "error");
    } finally {
      setGeneratingDaily(false);
    }
  }

  const categories = useMemo(() => CATEGORIES, []);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Quest Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track and conquer your daily challenges</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDaily}
            disabled={generatingDaily}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 flex items-center gap-1.5 border-gold/30 hover:border-gold/60"
          >
            <Sparkles size={16} className="text-gold" />
            {generatingDaily ? "Conjuring..." : "Daily Missions"}
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-glow"
          >
            <Plus size={16} /> New Quest
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden p-0.5">
          {(["active", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 text-xs font-semibold capitalize rounded-lg transition ${
                statusFilter === s
                  ? "bg-arcane text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            className="input w-auto text-xs py-2 pr-8"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input text-xs py-2 pl-9"
            placeholder="Search quest title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search quests"
          />
        </div>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : quests.length === 0 ? (
        <div className="card p-12 text-center space-y-3 border-dashed border-white/10">
          <p className="text-4xl">📜</p>
          <h3 className="font-display font-semibold text-base">No Quests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || categoryFilter
              ? "No quests match your current search filters. Try clearing your filters."
              : statusFilter === "completed"
              ? "You haven't completed any quests yet. Complete an active quest to record it here!"
              : "Your quest log is empty. Click '+ New Quest' above to begin your journey."}
          </p>
          {statusFilter === "active" && !search && !categoryFilter && (
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="btn-primary text-xs inline-flex mt-2"
            >
              <Plus size={14} /> Add First Quest
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {quests.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                completing={completingId === q.id}
                onComplete={q.completed ? undefined : handleComplete}
                onEdit={
                  q.completed
                    ? undefined
                    : (quest) => {
                        setEditing(quest);
                        setFormOpen(true);
                      }
                }
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <QuestFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmationModal
        open={!!deleteId}
        title="Abandon Quest"
        message="Are you sure you want to abandon and delete this quest? This action cannot be undone."
        confirmLabel="Delete Quest"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      {reward && (
        <RewardPopup
          show={!!reward}
          xp={reward.xp}
          gold={reward.gold}
          attributes={reward.attrs}
          onDone={() => setReward(null)}
        />
      )}
      {levelUp && (
        <LevelUpModal
          open={!!levelUp}
          beforeLevel={levelUp.beforeLevel}
          afterLevel={levelUp.afterLevel}
          xpGained={levelUp.xpGained}
          goldGained={levelUp.goldGained}
          onClose={() => setLevelUp(null)}
        />
      )}
    </div>
  );
}
