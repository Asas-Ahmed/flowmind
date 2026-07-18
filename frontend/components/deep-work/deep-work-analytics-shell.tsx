"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Clock3,
  Focus,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getDeepWorkWorkspace } from "@/lib/api";
import type { DeepWorkWorkspace } from "@/types/deep-work";

const card =
  "rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#11141f] dark:shadow-black/20";

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining}m`;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function DeepWorkAnalyticsShell() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<DeepWorkWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWorkspace(await getDeepWorkWorkspace());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load deep-work analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspace]);

  const chartMaximum = useMemo(
    () => Math.max(60, ...(workspace?.daily_points.map((point) => point.minutes) ?? [])),
    [workspace],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Deep work"
        insightText="Measure focused depth, continuity, and interruptions using your existing activity."
        insightValue={workspace ? `${workspace.score}/100` : "Ready"}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0"
      >
        <WorkspaceTopbar
          eyebrow="Focus intelligence"
          title="Deep Work Analytics"
          description="Understand how long you sustain meaningful focus, where interruptions occur, and which session lengths work best."
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className={`${card} relative overflow-hidden p-5 sm:p-7`}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  <Focus className="h-4 w-4" /> Focus quality, not only timer totals
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {workspace?.score_label ?? "Build your deep-work baseline"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  A completed focus block of at least 15 minutes contributes to deep-work analytics. Distraction entries marked as focus interruptions reduce continuity transparently.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadWorkspace()}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white transition hover:scale-105 dark:bg-white dark:text-slate-950"
                aria-label="Refresh deep-work analytics"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </section>

          {error ? (
            <section className={`${card} border-rose-200 p-6 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300`}>
              {error}
            </section>
          ) : null}

          {loading && !workspace ? (
            <section className={`${card} grid min-h-[420px] place-items-center`}>
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            </section>
          ) : workspace ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <article className={`${card} relative overflow-hidden p-6 md:col-span-2 xl:col-span-2`}>
                  <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Deep Work Score</p>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-6xl font-black tracking-tighter">{workspace.score}</span>
                        <span className="pb-2 text-sm font-bold text-slate-400">/ 100</span>
                      </div>
                    </div>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <Gauge className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" style={{ width: `${workspace.score}%` }} />
                  </div>
                </article>

                {[
                  { label: "This week", value: duration(workspace.weekly_minutes), icon: Clock3 },
                  { label: "Average session", value: duration(workspace.average_session_minutes), icon: TimerReset },
                  { label: "Longest session", value: duration(workspace.longest_session_minutes), icon: Zap },
                  { label: "Uninterrupted", value: `${workspace.uninterrupted_rate}%`, icon: ShieldCheck },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <article key={metric.label} className={`${card} p-5`}>
                      <Icon className="h-5 w-5 text-indigo-500" />
                      <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{metric.label}</p>
                      <p className="mt-2 text-2xl font-black tracking-tight">{metric.value}</p>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
                <article className={`${card} p-5 sm:p-7`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">14-day depth trend</p>
                      <h2 className="mt-2 text-2xl font-black">Focused minutes by day</h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <BarChart3 className="h-4 w-4" /> Completed 15+ minute sessions
                    </div>
                  </div>
                  <div className="mt-8 grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                    {workspace.daily_points.map((point) => (
                      <div key={point.date} className="min-w-0 text-center" title={`${point.minutes} minutes, ${point.interruptions} interruptions`}>
                        <div className="flex h-48 items-end rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">
                          <div
                            className={`w-full rounded-lg transition-all ${point.interruptions ? "bg-gradient-to-t from-amber-500 to-rose-400" : "bg-gradient-to-t from-indigo-600 to-cyan-400"}`}
                            style={{ height: `${Math.max(point.minutes ? 8 : 2, (point.minutes / chartMaximum) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 truncate text-[9px] font-black text-slate-500 dark:text-slate-400">{point.label}</p>
                        <p className="mt-0.5 text-[9px] font-bold text-slate-400">{point.minutes}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={`${card} p-5 sm:p-7`}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/12 text-violet-600 dark:text-violet-300">
                      <Brain className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Flow Assistant</p>
                      <h2 className="text-xl font-black">{workspace.insight.title}</h2>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{workspace.insight.message}</p>
                  <button
                    type="button"
                    onClick={() => router.push(workspace.insight.action_href)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25"
                  >
                    {workspace.insight.action_label}<ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-amber-500/8 p-4">
                      <p className="text-xs font-bold text-slate-400">Interruptions</p>
                      <p className="mt-1 text-xl font-black">{workspace.interruptions}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{workspace.interruption_minutes} min lost</p>
                    </div>
                    <div className="rounded-2xl bg-blue-500/8 p-4">
                      <p className="text-xs font-bold text-slate-400">Recovery proxy</p>
                      <p className="mt-1 text-xl font-black">{duration(workspace.average_recovery_minutes)}</p>
                      <p className="mt-1 text-[11px] text-slate-400">average logged loss</p>
                    </div>
                  </div>
                </article>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <article className={`${card} p-6`}>
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-xl font-black">Which session length works best?</h2>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {workspace.session_bands.map((band) => (
                      <div key={band.label} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/[0.07] dark:bg-white/[0.035]">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-black">{band.label}</p><p className="mt-1 text-xs font-bold text-slate-400">{band.range_label}</p></div>
                          <span className="rounded-lg bg-white px-2 py-1 text-xs font-black shadow-sm dark:bg-white/[0.07]">{band.sessions}</span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.07]">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${band.completion_rate}%` }} />
                        </div>
                        <div className="mt-3 flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400"><span>{band.completion_rate}% completed</span><span>{duration(band.total_minutes)}</span></div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={`${card} p-6`}>
                  <h2 className="text-xl font-black">Weekly comparison</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Deep-work minutes compared with the previous seven-day period.</p>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div><p className="text-xs font-bold text-slate-400">Current</p><p className="mt-1 text-3xl font-black">{duration(workspace.weekly_minutes)}</p></div>
                    <div className="text-right"><p className="text-xs font-bold text-slate-400">Previous</p><p className="mt-1 text-xl font-black">{duration(workspace.previous_week_minutes)}</p></div>
                  </div>
                  <div className={`mt-5 flex items-center gap-2 rounded-2xl p-4 text-sm font-black ${workspace.weekly_change === null ? "bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300" : workspace.weekly_change >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
                    {workspace.weekly_change === null ? <Sparkles className="h-4 w-4" /> : workspace.weekly_change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {workspace.weekly_change === null ? "New comparison baseline" : `${Math.abs(workspace.weekly_change)}% ${workspace.weekly_change >= 0 ? "more" : "less"} deep work`}
                  </div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.035]">
                    <p className="text-xs font-bold text-slate-400">Strongest focus window</p>
                    <p className="mt-1 font-black">{workspace.best_focus_window ?? "Still learning"}</p>
                  </div>
                </article>
              </section>
            </>
          ) : null}
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
