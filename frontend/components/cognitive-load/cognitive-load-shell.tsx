"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  CalendarDays,
  Clock3,
  Gauge,
  Layers3,
  Lightbulb,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createCognitiveLoadEntry,
  deleteCognitiveLoadEntry,
  getCognitiveLoadWorkspace,
} from "@/lib/api";
import type {
  CognitiveDifficulty,
  CognitiveLoadEntry,
  CognitiveLoadWorkspace,
} from "@/types/cognitive-load";

const difficultyOptions: Array<{
  value: CognitiveDifficulty;
  label: string;
  points: string;
  description: string;
}> = [
  {
    value: "light",
    label: "Light",
    points: "1 point / hour",
    description: "Routine admin, review, or simple actions.",
  },
  {
    value: "moderate",
    label: "Moderate",
    points: "2 points / hour",
    description: "Focused work that needs steady attention.",
  },
  {
    value: "deep",
    label: "Deep",
    points: "3 points / hour",
    description: "Complex work, learning, writing, or problem-solving.",
  },
];

function localDateValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function formatMinutes(value: number) {
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function difficultyLabel(value: CognitiveDifficulty) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BrainCircuit;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-indigo-600 dark:bg-white/[0.07] dark:text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Today
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function CognitiveLoadShell() {
  const today = useMemo(() => localDateValue(new Date()), []);
  const [workspace, setWorkspace] = useState<CognitiveLoadWorkspace | null>(null);
  const [entryDate, setEntryDate] = useState(today);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<CognitiveDifficulty>("moderate");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getCognitiveLoadWorkspace());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the cognitive load workspace",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCognitiveLoadWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the cognitive load workspace",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewPoints = useMemo(() => {
    const base = difficulty === "light" ? 1 : difficulty === "moderate" ? 2 : 3;
    return base * Math.max(1, Math.round(estimatedMinutes / 60));
  }, [difficulty, estimatedMinutes]);

  async function saveEntry() {
    if (!title.trim()) {
      setError("Enter a work item title before saving");
      return;
    }

    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await createCognitiveLoadEntry({
        entry_date: entryDate,
        title: title.trim(),
        difficulty,
        estimated_minutes: estimatedMinutes,
        note: note.trim() || null,
      });
      setTitle("");
      setNote("");
      setSaved(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this cognitive load item",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(entry: CognitiveLoadEntry) {
    const confirmed = window.confirm(
      `Delete “${entry.title}” from your cognitive load history?`,
    );
    if (!confirmed) return;

    setDeletingId(entry.id);
    setError("");
    try {
      await deleteCognitiveLoadEntry(entry.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this cognitive load item",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const maxWeekScore = Math.max(12, ...(workspace?.week_points.map((point) => point.score) ?? [0]));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Cognitive capacity"
        insightText="Use the meter to balance demanding work. It is a planning aid, not a medical assessment."
        insightValue={workspace?.today_entries ? `${workspace.capacity_score}%` : "Ready"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar
          eyebrow="Workload awareness"
          title="Cognitive Load Meter"
          description="Classify planned work by mental difficulty and keep demanding tasks within a sustainable daily range."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh cognitive load data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          }
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-6 sm:px-6 xl:px-8 xl:pb-10">
          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard icon={Gauge} label="Daily load score" value={`${workspace?.today_score ?? 0} / 12`} detail={`Current level: ${workspace?.load_level ?? "empty"}`} />
            <StatCard icon={BrainCircuit} label="Remaining capacity" value={`${workspace?.capacity_score ?? 100}%`} detail="Higher means more cognitive room remains" />
            <StatCard icon={Layers3} label="Deep work items" value={`${workspace?.deep_count ?? 0}`} detail={`${workspace?.moderate_count ?? 0} moderate and ${workspace?.light_count ?? 0} light`} />
            <StatCard icon={Clock3} label="Planned duration" value={formatMinutes(workspace?.estimated_minutes ?? 0)} detail={`Weekly average score: ${workspace?.weekly_average ?? 0}`} />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Work item</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Add to your mental workload</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Difficulty points scale with estimated duration to keep the score explainable.</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                  <BrainCircuit className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_180px]">
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Work item</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="e.g. Draft implementation chapter" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Date</span>
                  <input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {difficultyOptions.map((option) => (
                  <button key={option.value} type="button" onClick={() => setDifficulty(option.value)} className={`rounded-2xl border p-4 text-left transition ${difficulty === option.value ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-500/10 dark:border-cyan-400/40 dark:bg-cyan-400/[0.08]" : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-white/20"}`}>
                    <span className="text-sm font-black">{option.label}</span>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-cyan-300">{option.points}</span>
                    <span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{option.description}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Estimated minutes</span>
                  <input type="number" min={5} max={480} step={5} value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(Math.max(5, Math.min(480, Number(event.target.value) || 5)))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Optional note</span>
                  <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Context, constraints, or first step" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Estimated impact</p>
                  <p className="mt-1 text-sm font-bold">{previewPoints} cognitive point{previewPoints === 1 ? "" : "s"}</p>
                </div>
                <button type="button" disabled={busy} onClick={() => void saveEntry()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  <Plus className="h-4 w-4" />
                  {busy ? "Saving..." : "Add work item"}
                </button>
              </div>

              {saved && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">Work item added to your cognitive load plan.</p>}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-indigo-500/15">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Flow Assistant</p>
                  <h2 className="text-xl font-black">{workspace?.insight.title ?? "Plan a balanced day"}</h2>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-white/85">{workspace?.insight.message ?? "Add planned work so FlowMind can evaluate the mix."}</p>
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Suggested action</p>
                    <p className="mt-2 text-sm font-semibold leading-6">{workspace?.insight.action ?? "Classify your first work item."}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Daily meter</span>
                  <span className="text-3xl font-black">{workspace?.today_score ?? 0}<span className="text-base text-white/60">/12</span></span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((workspace?.today_score ?? 0) / 12) * 100)}%` }} className="h-full rounded-full bg-white" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Seven-day view</p>
                  <h2 className="mt-1 text-xl font-black">Load pattern</h2>
                </div>
                <Activity className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-7 flex h-48 items-end gap-3">
                {(workspace?.week_points ?? []).map((point) => (
                  <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{point.score}</span>
                    <div className="flex h-36 w-full items-end rounded-2xl bg-slate-100 p-1 dark:bg-white/[0.04]">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(point.score ? 8 : 0, (point.score / maxWeekScore) * 100)}%` }} className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-cyan-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatDay(point.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">History</p>
                  <h2 className="mt-1 text-xl font-black">Recent work items</h2>
                </div>
                <CalendarDays className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5 space-y-3">
                {!workspace?.recent_entries.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-white/15">
                    <BrainCircuit className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm font-bold">No cognitive load items yet</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add your first planned work item above.</p>
                  </div>
                )}

                {workspace?.recent_entries.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.025]">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-white/[0.07] dark:text-cyan-300"><Layers3 className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black">{entry.title}</p>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-cyan-400/10 dark:text-cyan-300">{difficultyLabel(entry.difficulty)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(entry.entry_date)} · {formatMinutes(entry.estimated_minutes)}</p>
                      {entry.note && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{entry.note}</p>}
                    </div>
                    <button type="button" disabled={deletingId === entry.id} onClick={() => void removeEntry(entry)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-400/10 dark:hover:text-rose-300" aria-label={`Delete ${entry.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
