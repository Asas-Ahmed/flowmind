"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Gauge,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Scale,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getTimeTrackingWorkspace, updateWorkCategory } from "@/lib/api";
import type { TimeBreakdownItem, TimeTrackingWorkspace, WorkCategory } from "@/types/time-tracking";

type BudgetRow = {
  category: WorkCategory;
  actualSeconds: number;
  plannedSeconds: number;
  varianceSeconds: number;
  percentage: number;
};

const card = "rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/40 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none";

function formatDuration(seconds: number) {
  const absolute = Math.abs(seconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.round((absolute % 3600) / 60);
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function signedDuration(seconds: number) {
  if (seconds === 0) return "On budget";
  return `${seconds > 0 ? "+" : "−"}${formatDuration(seconds)}`;
}

function progressTone(percentage: number) {
  if (percentage > 110) return "bg-rose-500";
  if (percentage >= 85) return "bg-amber-500";
  return "bg-emerald-500";
}

function findActual(category: WorkCategory, breakdown: TimeBreakdownItem[]) {
  return breakdown.find((item) => item.category_id === category.id)?.seconds ?? 0;
}

export function TimeBudgetShell() {
  const [workspace, setWorkspace] = useState<TimeTrackingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hours, setHours] = useState("");
  const [error, setError] = useState("");

  const load = async (quiet = false) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      setWorkspace(await getTimeTrackingWorkspace());
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load your time budget."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, []);

  const rows = useMemo<BudgetRow[]>(() => {
    if (!workspace) return [];
    return workspace.categories
      .filter((category) => !category.is_archived)
      .map((category) => {
        const actualSeconds = findActual(category, workspace.category_breakdown);
        const plannedSeconds = (category.weekly_target_minutes ?? 0) * 60;
        return {
          category,
          actualSeconds,
          plannedSeconds,
          varianceSeconds: actualSeconds - plannedSeconds,
          percentage: plannedSeconds ? Math.round((actualSeconds / plannedSeconds) * 100) : 0,
        };
      })
      .sort((a, b) => {
        if (!a.plannedSeconds && b.plannedSeconds) return 1;
        if (a.plannedSeconds && !b.plannedSeconds) return -1;
        return b.actualSeconds - a.actualSeconds;
      });
  }, [workspace]);

  const plannedRows = rows.filter((row) => row.plannedSeconds > 0);
  const plannedSeconds = plannedRows.reduce((total, row) => total + row.plannedSeconds, 0);
  const actualSeconds = plannedRows.reduce((total, row) => total + row.actualSeconds, 0);
  const varianceSeconds = actualSeconds - plannedSeconds;
  const utilization = plannedSeconds ? Math.round((actualSeconds / plannedSeconds) * 100) : 0;
  const overBudget = plannedRows.filter((row) => row.percentage > 100);
  const balanced = plannedRows.filter((row) => row.percentage >= 75 && row.percentage <= 100);
  const dayIndex = Math.min(7, Math.max(1, new Date().getDay() || 7));
  const expectedPace = Math.round((dayIndex / 7) * 100);

  const startEditing = (category: WorkCategory) => {
    setEditingId(category.id);
    setHours(category.weekly_target_minutes ? String(category.weekly_target_minutes / 60) : "");
  };

  const saveBudget = async (category: WorkCategory) => {
    const parsed = Number(hours);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 168) {
      setError("Enter a weekly budget between 0 and 168 hours.");
      return;
    }
    setSavingId(category.id);
    setError("");
    try {
      await updateWorkCategory(category.id, {
        weekly_target_minutes: parsed === 0 ? null : Math.round(parsed * 60),
      });
      setEditingId(null);
      await load(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to save the weekly budget.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#070b17] dark:text-white">
      <WorkspaceSidebar />

      <div className="min-w-0 xl:pl-[272px]">
        <WorkspaceTopbar
          eyebrow="Planning & balance"
          title="Time Budget"
          description="Compare planned weekly hours with the time you actually invest across every work category."
        />

        <main className="mx-auto max-w-7xl space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {error ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
            </div>
          ) : null}

          {loading ? (
            <div className={`${card} flex min-h-80 items-center justify-center`}>
              <LoaderCircle className="h-7 w-7 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Weekly budget", formatDuration(plannedSeconds), Target],
                  ["Actual tracked", formatDuration(actualSeconds), Clock3],
                  ["Budget usage", plannedSeconds ? `${utilization}%` : "Not set", Gauge],
                  ["Net variance", plannedSeconds ? signedDuration(varianceSeconds) : "—", Scale],
                ].map(([label, value, Icon]) => (
                  <motion.article key={String(label)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${card} p-5`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{String(label)}</p>
                      <Icon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">{String(value)}</p>
                  </motion.article>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
                <div className={`${card} overflow-hidden`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
                    <div>
                      <h2 className="font-semibold">Planned versus actual</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Edit a category to change its reusable weekly allocation.</p>
                    </div>
                    <button onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5">
                      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                    {rows.length ? rows.map((row) => (
                      <div key={row.category.id} className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.category.color }} />
                              <h3 className="truncate font-semibold">{row.category.name}</h3>
                              {row.plannedSeconds ? (
                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.percentage > 110 ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200" : row.percentage >= 75 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"}`}>
                                  {row.percentage}% used
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                              <div className={`h-full rounded-full transition-all ${progressTone(row.percentage)}`} style={{ width: `${Math.min(100, row.plannedSeconds ? row.percentage : 0)}%` }} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                              <span>Actual <strong className="text-slate-800 dark:text-slate-200">{formatDuration(row.actualSeconds)}</strong></span>
                              <span>Planned <strong className="text-slate-800 dark:text-slate-200">{row.plannedSeconds ? formatDuration(row.plannedSeconds) : "Not set"}</strong></span>
                              {row.plannedSeconds ? <span>Variance <strong className={row.varianceSeconds > 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}>{signedDuration(row.varianceSeconds)}</strong></span> : null}
                            </div>
                          </div>

                          {editingId === row.category.id ? (
                            <div className="flex items-center gap-2">
                              <label className="relative">
                                <input value={hours} onChange={(event) => setHours(event.target.value)} type="number" min="0" max="168" step="0.5" className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm outline-none ring-indigo-500 focus:ring-2 dark:border-white/10 dark:bg-white/5" autoFocus />
                                <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-slate-400">h</span>
                              </label>
                              <button onClick={() => void saveBudget(row.category)} disabled={savingId === row.category.id} className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-500 disabled:opacity-60" aria-label="Save budget">
                                {savingId === row.category.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10" aria-label="Cancel editing"><X className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEditing(row.category)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                              <Pencil className="h-4 w-4" /> {row.plannedSeconds ? "Edit" : "Set budget"}
                            </button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="px-5 py-14 text-center text-sm text-slate-500 dark:text-slate-400">Create work categories first, then assign weekly budgets here.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={`${card} p-5`}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      <h2 className="font-semibold">Flow Assistant</h2>
                    </div>
                    {!plannedRows.length ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Set weekly budgets for your main categories. Start with realistic allocations based on the last two weeks rather than ideal targets.</p>
                    ) : overBudget.length ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300"><strong>{overBudget[0].category.name}</strong> is currently {formatDuration(overBudget[0].varianceSeconds)} over its planned allocation.</p>
                        <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">Decide whether this reflects an intentional priority shift or work that should be reduced, delegated, or moved.</p>
                      </div>
                    ) : utilization < expectedPace - 15 ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">You are using your budget more slowly than the current weekly pace. Protect time for the most important underused category before the week closes.</p>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Your tracked time is broadly aligned with the plan. Preserve the balance and avoid filling unused capacity with low-value work.</p>
                    )}
                  </div>

                  <div className={`${card} p-5`}>
                    <h2 className="font-semibold">Budget health</h2>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                        <span className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Balanced</span>
                        <strong>{balanced.length}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                        <span className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-rose-500" /> Over budget</span>
                        <strong>{overBudget.length}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                        <span className="flex items-center gap-2 text-sm">{varianceSeconds > 0 ? <ArrowUpRight className="h-4 w-4 text-rose-500" /> : <ArrowDownRight className="h-4 w-4 text-emerald-500" />} Overall variance</span>
                        <strong>{plannedRows.length ? signedDuration(varianceSeconds) : "—"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={`${card} p-5`}>
                    <h2 className="font-semibold">Weekly pace</h2>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-3xl font-semibold">{utilization}%</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">used by day {dayIndex} of 7</p>
                      </div>
                      <div className="text-right text-sm text-slate-500 dark:text-slate-400">Expected pace<br /><strong className="text-slate-800 dark:text-slate-200">{expectedPace}%</strong></div>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, utilization)}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <div className="xl:hidden"><WorkspaceNavigation variant="mobile" /></div>
    </div>
  );
}
