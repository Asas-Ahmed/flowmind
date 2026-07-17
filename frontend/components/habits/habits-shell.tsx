"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  ArrowLeft,
  Brain,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Leaf,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import { SpinnerLoader } from "@/components/common/spinner-loader";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  checkInHabit,
  createHabit,
  deleteHabit,
  getHabitWorkspace,
  updateHabit,
} from "@/lib/api";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitPayload,
  HabitWorkspace,
} from "@/types/habit";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "study", label: "Study" },
  { value: "work", label: "Work" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "fitness", label: "Fitness" },
  { value: "personal", label: "Personal" },
];
const COLORS = ["#4a6ded", "#762bbc", "#cf4de1", "#06b6d4", "#10b981", "#f97316"];

const emptyForm: HabitPayload = {
  name: "",
  description: null,
  category: "personal",
  color: "#4a6ded",
  icon: "sparkles",
  frequency: "daily",
  scheduled_days: [],
  target_count: 1,
  unit: "times",
  reminder_enabled: false,
  reminder_time: null,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: null,
  is_archived: false,
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function categoryIcon(category: HabitCategory) {
  if (category === "health") return HeartPulse;
  if (category === "fitness") return Dumbbell;
  if (category === "study") return Brain;
  if (category === "mindfulness") return Leaf;
  if (category === "work") return Target;
  return Sparkles;
}

function frequencyLabel(habit: Habit) {
  if (habit.frequency === "daily") return "Every day";
  if (habit.frequency === "weekdays") return "Weekdays";
  if (habit.frequency === "weekly") return "Weekly";
  return habit.scheduled_days.map((day) => DAYS[day]).join(", ");
}

export function HabitsShell() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<HabitWorkspace | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | HabitCategory>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyHabitId, setBusyHabitId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setWorkspace(await getHabitWorkspace(formatDate(selectedDate)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load habits.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadWorkspace]);

  const filteredHabits = useMemo(() => {
    const habits = workspace?.habits ?? [];
    return habits.filter((habit) => {
      const matchesSearch =
        habit.name.toLowerCase().includes(search.toLowerCase()) ||
        (habit.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || habit.category === categoryFilter;
      const matchesCompletion = showCompleted || !habit.completed_today;
      return matchesSearch && matchesCategory && matchesCompletion;
    });
  }, [workspace, search, categoryFilter, showCompleted]);

  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + offset);
    return Array.from({ length: 7 }, (_, index) => {
      const result = new Date(start);
      result.setDate(start.getDate() + index);
      return result;
    });
  }, [selectedDate]);

  function openCreateForm() {
    setEditingHabit(null);
    setForm({ ...emptyForm, start_date: formatDate(selectedDate) });
    setFormOpen(true);
  }

  function openEditForm(habit: Habit) {
    setEditingHabit(habit);
    setForm({
      name: habit.name,
      description: habit.description,
      category: habit.category,
      color: habit.color,
      icon: habit.icon,
      frequency: habit.frequency,
      scheduled_days: habit.scheduled_days,
      target_count: habit.target_count,
      unit: habit.unit,
      reminder_enabled: habit.reminder_enabled,
      reminder_time: habit.reminder_time,
      start_date: habit.start_date,
      end_date: habit.end_date,
      is_archived: habit.is_archived,
    });
    setFormOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      if (editingHabit) {
        await updateHabit(editingHabit.id, form);
      } else {
        await createHabit(form);
      }
      setFormOpen(false);
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save habit.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleHabit(habit: Habit) {
    try {
      setBusyHabitId(habit.id);
      setError("");
      await checkInHabit(habit.id, {
        completion_date: formatDate(selectedDate),
        count: habit.completed_today ? 0 : habit.target_count,
      });
      await loadWorkspace();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update habit.");
    } finally {
      setBusyHabitId(null);
    }
  }

  async function incrementHabit(habit: Habit) {
    try {
      setBusyHabitId(habit.id);
      await checkInHabit(habit.id, {
        completion_date: formatDate(selectedDate),
        count: Math.min(habit.today_count + 1, habit.target_count),
      });
      await loadWorkspace();
    } catch (incrementError) {
      setError(incrementError instanceof Error ? incrementError.message : "Unable to update habit.");
    } finally {
      setBusyHabitId(null);
    }
  }

  async function removeHabit(habit: Habit) {
    if (!window.confirm(`Delete “${habit.name}” and its completion history?`)) return;
    try {
      setBusyHabitId(habit.id);
      await deleteHabit(habit.id);
      await loadWorkspace();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete habit.");
    } finally {
      setBusyHabitId(null);
    }
  }

  function moveDate(days: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  const completionPercent = workspace?.today_total
    ? Math.round((workspace.today_completed / workspace.today_total) * 100)
    : 0;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f6f7fb] text-slate-950 dark:bg-[#050712] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,109,237,0.14),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(207,77,225,0.12),transparent_28%),linear-gradient(to_bottom,transparent,rgba(255,255,255,0.18))] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,242,253,0.08),transparent_30%),radial-gradient(circle_at_88%_8%,rgba(189,67,254,0.11),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(15,23,42,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.7)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-[0.045]" />

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/78 shadow-sm shadow-slate-900/[0.025] backdrop-blur-2xl dark:border-white/10 dark:bg-[#050713]/78 dark:shadow-black/10">
        <div className="mx-auto flex max-w-[1720px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="hidden rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 shadow-sm transition hover:-translate-x-0.5 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:block"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-cyan-300">FlowMind · Habit workspace</p>
            <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">Build consistency that lasts</h1>
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-2xl aurora-gradient px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/25 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New habit</span>
          </button>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1720px] gap-6 px-4 py-6 pb-28 sm:px-6 xl:grid-cols-[292px_minmax(0,1fr)] xl:px-8 xl:pb-8">
        <aside className="hidden xl:block">
          <div className="sticky top-[5.75rem] h-[calc(100vh-7.25rem)]">
            <section className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/88 shadow-xl shadow-slate-900/[0.045] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0a0e1d]/88 dark:shadow-black/30">
              <div className="habit-workspace-nav min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5">
                <WorkspaceNavigation
                  counts={{
                    habits: workspace?.habits.length ?? 0,
                  }}
                />
              </div>

              <div className="space-y-3 border-t border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="relative overflow-hidden rounded-[1.45rem] border border-indigo-200/70 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-4 text-white shadow-lg shadow-indigo-500/20 dark:border-white/10 dark:shadow-black/25">
                  <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Today&apos;s rhythm</p>
                      <p className="mt-1 text-sm font-bold">Daily completion</p>
                    </div>
                    <span className="rounded-xl bg-white/15 px-2.5 py-1 text-sm font-black ring-1 ring-white/15">{completionPercent}%</span>
                  </div>

                  <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-black/15">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      transition={{ duration: 0.65, ease: "easeOut" }}
                      className="h-full rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.55)]"
                    />
                  </div>

                  <p className="relative mt-3 text-xs leading-5 text-white/72">
                    {workspace?.today_total
                      ? `${workspace.today_completed} of ${workspace.today_total} habits completed today.`
                      : "Create your first routine and begin building momentum."}
                  </p>
                </div>

                <div className="rounded-[1.45rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/12 dark:text-violet-300">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">Flow insight</p>
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {workspace?.longest_streak
                          ? `Your ${workspace.longest_streak}-day best streak proves that small actions compound.`
                          : "Consistency grows when the next action feels easy to start."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {error && (
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button>
            </div>
          )}

          <section className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/92 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                  <Flame className="h-3.5 w-3.5" /> Build a better rhythm
                </span>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">Turn small actions into a reliable daily rhythm.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Plan repeatable routines, record progress in seconds, and make every streak feel visible and achievable.
                </p>
              </div>
              <div className="relative h-36 w-36 shrink-0 self-center rounded-full bg-white/70 p-2 shadow-xl shadow-indigo-500/10 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-white/10">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="9" className="text-slate-100 dark:text-white/10" />
                  <motion.circle
                    cx="60" cy="60" r="50" fill="none" stroke="url(#habitGradient)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={314}
                    initial={{ strokeDashoffset: 314 }}
                    animate={{ strokeDashoffset: 314 - (314 * completionPercent) / 100 }}
                    transition={{ duration: 0.8 }}
                  />
                  <defs><linearGradient id="habitGradient"><stop stopColor="#4a6ded" /><stop offset="1" stopColor="#cf4de1" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{completionPercent}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Today</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Today", `${workspace?.today_completed ?? 0}/${workspace?.today_total ?? 0}`, Check, "Completed habits"],
              ["Weekly rate", `${workspace?.weekly_rate ?? 0}%`, TrendingUp, "Last seven days"],
              ["Best streak", `${workspace?.longest_streak ?? 0} days`, Flame, "Personal record"],
              ["Active habits", `${workspace?.habits.length ?? 0}`, Target, "Current routines"],
            ].map(([label, value, Icon, helper]) => (
              <article key={label as string} className="group rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 shadow-lg shadow-slate-900/[0.035] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label as string}</p>
                    <p className="mt-3 text-3xl font-black tracking-tight">{value as string}</p>
                    <p className="mt-1 text-xs text-slate-400">{helper as string}</p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 transition group-hover:scale-105 dark:bg-indigo-400/10 dark:text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white/82 p-4 shadow-xl shadow-slate-900/[0.035] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/10 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => moveDate(-7)} className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
              <div className="text-center">
                <p className="font-semibold">Weekly rhythm</p>
                <p className="text-xs text-slate-400">Select a day to review or update</p>
              </div>
              <button type="button" onClick={() => moveDate(7)} className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {weekDates.map((date, index) => {
                const active = formatDate(date) === formatDate(selectedDate);
                const today = formatDate(date) === formatDate(new Date());
                return (
                  <button
                    key={formatDate(date)}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`rounded-2xl border px-1 py-3 text-center transition ${active ? "border-transparent aurora-gradient text-white shadow-lg shadow-indigo-500/20" : "border-slate-200/70 bg-slate-50/80 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"}`}
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-70">{DAYS[index]}</span>
                    <span className="mt-1 block text-lg font-bold">{date.getDate()}</span>
                    {today && <span className={`mx-auto mt-1 block h-1 w-1 rounded-full ${active ? "bg-white" : "bg-indigo-500"}`} />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Your habit collection</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search habits" className="habit-field w-full pl-10" />
                </label>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | HabitCategory)} className="habit-select min-w-44">
                  <option value="all">All categories</option>
                  {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <button type="button" onClick={() => setShowCompleted((value) => !value)} className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${showCompleted ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-200" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"}`}>
                  {showCompleted ? "Showing completed" : "Hide completed"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"><SpinnerLoader /></div>
            ) : filteredHabits.length === 0 ? (
              <div className="rounded-[2.25rem] border border-dashed border-slate-300 bg-white/65 px-6 py-20 text-center shadow-inner dark:border-white/15 dark:bg-white/[0.035]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300"><Leaf className="h-6 w-6" /></div>
                <h3 className="mt-4 text-lg font-bold">No habits found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Create a small repeatable action, or change the current filters.</p>
                <button type="button" onClick={openCreateForm} className="mt-5 rounded-2xl aurora-gradient px-5 py-2.5 text-sm font-semibold text-white">Create your first habit</button>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredHabits.map((habit) => {
                  const Icon = categoryIcon(habit.category);
                  const progress = Math.min(100, Math.round((habit.today_count / habit.target_count) * 100));
                  return (
                    <motion.article layout key={habit.id} className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/88 p-5 shadow-lg shadow-slate-900/[0.035] transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/[0.07] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-black/10">
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => void toggleHabit(habit)}
                          disabled={busyHabitId === habit.id}
                          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 transition duration-300 hover:scale-105 disabled:cursor-wait disabled:opacity-70 ${habit.completed_today ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-white/5"}`}
                          style={habit.completed_today ? { backgroundColor: habit.color } : undefined}
                        >
                          {busyHabitId === habit.id ? <LoaderCircle className="h-5 w-5 animate-spin" /> : habit.completed_today ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" style={{ color: habit.color }} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-black tracking-tight">{habit.name}</h3>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-300">{habit.category}</span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{habit.description || frequencyLabel(habit)}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                              <button type="button" onClick={() => openEditForm(habit)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><Pencil className="h-4 w-4" /></button>
                              <button type="button" onClick={() => void removeHabit(habit)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{frequencyLabel(habit)}</span>
                            <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-500" />{habit.current_streak} day streak</span>
                            {habit.reminder_enabled && <span className="inline-flex items-center gap-1.5"><AlarmClock className="h-3.5 w-3.5" />{habit.reminder_time}</span>}
                          </div>

                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium">Today: {habit.today_count}/{habit.target_count} {habit.unit}</span><span className="text-slate-400">{progress}%</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ backgroundColor: habit.color }} /></div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs"><span className="font-semibold">{habit.completion_rate}%</span><span className="text-slate-400">30-day consistency</span></div>
                            {!habit.completed_today && habit.target_count > 1 && (
                              <button type="button" onClick={() => void incrementHabit(habit)} disabled={busyHabitId === habit.id} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-200">+ Add progress</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>

      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[2.25rem] border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#080d1d] sm:rounded-[2.25rem] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-300">Habit builder</p><h2 className="mt-1 text-2xl font-bold">{editingHabit ? "Edit habit" : "Create a new habit"}</h2></div>
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={submitForm} className="mt-6 space-y-5">
                <div><label className="text-sm font-semibold">Habit name</label><input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Read for 20 minutes" className="habit-field mt-2" /></div>
                <div><label className="text-sm font-semibold">Description</label><textarea value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value || null })} placeholder="Why this routine matters to you" rows={3} className="habit-field mt-2 resize-none" /></div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="text-sm font-semibold">Category</label><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as HabitCategory })} className="habit-select mt-2 w-full">{CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
                  <div><label className="text-sm font-semibold">Frequency</label><select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as HabitFrequency })} className="habit-select mt-2 w-full"><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekly">Once weekly</option><option value="custom">Custom days</option></select></div>
                </div>

                {form.frequency === "custom" && (
                  <div><label className="text-sm font-semibold">Repeat on</label><div className="mt-2 grid grid-cols-7 gap-2">{DAYS.map((day, index) => { const active = form.scheduled_days.includes(index); return <button key={day} type="button" onClick={() => setForm({ ...form, scheduled_days: active ? form.scheduled_days.filter((item) => item !== index) : [...form.scheduled_days, index] })} className={`rounded-xl py-2 text-xs font-semibold transition ${active ? "aurora-gradient text-white" : "border border-slate-200 dark:border-white/10"}`}>{day}</button>; })}</div></div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="text-sm font-semibold">Daily target</label><input type="number" min={1} max={1000} value={form.target_count} onChange={(event) => setForm({ ...form, target_count: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/5" /></div>
                  <div><label className="text-sm font-semibold">Unit</label><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="times, glasses, pages" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/5" /></div>
                </div>

                <div><label className="text-sm font-semibold">Color</label><div className="mt-2 flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} type="button" onClick={() => setForm({ ...form, color })} className={`h-10 w-10 rounded-xl border-4 transition ${form.color === color ? "border-slate-950 scale-110 dark:border-white" : "border-transparent"}`} style={{ backgroundColor: color }} aria-label={`Select ${color}`} />)}</div></div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex items-center justify-between gap-4"><div><p className="font-semibold">Reminder</p><p className="text-xs text-slate-400">Show when you want to complete this habit.</p></div><button type="button" onClick={() => setForm({ ...form, reminder_enabled: !form.reminder_enabled, reminder_time: !form.reminder_enabled ? form.reminder_time ?? "09:00" : null })} className={`relative h-7 w-12 rounded-full transition ${form.reminder_enabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-white/15"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${form.reminder_enabled ? "left-6" : "left-1"}`} /></button></div>
                  {form.reminder_enabled && <input type="time" value={form.reminder_time ?? "09:00"} onChange={(event) => setForm({ ...form, reminder_time: event.target.value })} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/5" />}
                </div>

                <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-semibold">Start date</label><input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="habit-select mt-2 w-full" /></div><div><label className="text-sm font-semibold">Optional end date</label><input type="date" value={form.end_date ?? ""} onChange={(event) => setForm({ ...form, end_date: event.target.value || null })} className="habit-select mt-2 w-full" /></div></div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end"><button type="button" onClick={() => setFormOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">Cancel</button><button disabled={saving} type="submit" className="flex items-center justify-center gap-2 rounded-2xl aurora-gradient px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{editingHabit ? "Save changes" : "Create habit"}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WorkspaceNavigation
        variant="mobile"
        counts={{
          habits: workspace?.habits.length ?? 0,
        }}
      />

      <style jsx global>{`
        .habit-workspace-nav button[aria-current="page"] {
          color: white !important;
        }

        .habit-workspace-nav button[aria-current="page"] > span:first-child {
          background: linear-gradient(135deg, #4a6ded 0%, #762bbc 52%, #cf4de1 100%) !important;
          box-shadow: 0 14px 30px rgb(74 109 237 / 0.24) !important;
        }

        .dark .habit-workspace-nav button[aria-current="page"] {
          color: white !important;
        }

        .dark .habit-workspace-nav button[aria-current="page"] > span:first-child {
          background: linear-gradient(135deg, #4a6ded 0%, #762bbc 52%, #cf4de1 100%) !important;
        }

        .dark .habit-workspace-nav button[aria-current="page"] > span:nth-child(2) {
          background: rgb(255 255 255 / 0.14) !important;
        }

        .habit-workspace-nav::-webkit-scrollbar {
          width: 5px;
        }

        .habit-workspace-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .habit-workspace-nav::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgb(148 163 184 / 0.35);
        }

        .dark .habit-workspace-nav::-webkit-scrollbar-thumb {
          background: rgb(255 255 255 / 0.16);
        }

        .habit-field {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252 / 0.9);
          color: rgb(15 23 42);
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        }

        .habit-field:focus {
          border-color: rgb(99 102 241);
          background: white;
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.12);
        }

        .habit-select {
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(15 23 42);
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          color-scheme: light;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .habit-select:focus {
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.12);
        }

        .habit-select option {
          background: white;
          color: rgb(15 23 42);
        }

        .dark .habit-field {
          border-color: rgb(255 255 255 / 0.1);
          background: rgb(255 255 255 / 0.05);
          color: rgb(241 245 249);
        }

        .dark .habit-field:focus {
          background: #0b1022;
        }

        .dark .habit-select {
          border-color: rgb(255 255 255 / 0.1);
          background: #0b1022;
          color: rgb(241 245 249);
          color-scheme: dark;
        }

        .dark .habit-select option {
          background: #0b1022;
          color: rgb(241 245 249);
        }
      `}</style>
    </main>
  );
}
