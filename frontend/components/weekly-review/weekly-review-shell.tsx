"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Award, Brain, CalendarRange, Clock3, Flame, RefreshCw, ShieldAlert, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getWeeklyReview } from "@/lib/api";
import type { WeeklyReview } from "@/types/weekly-review";

const card = "rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#11141f] dark:shadow-black/20";

function rangeLabel(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}


export function WeeklyReviewShell() {
  const router = useRouter();
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReview(await getWeeklyReview(weekOffset));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not build your weekly review.");
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadReview(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadReview]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar insightTitle="Weekly reflection" insightText="Review the patterns behind your progress, not only the totals." insightValue={review ? `${review.score}/100` : "Ready"} />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0">
        <WorkspaceTopbar eyebrow="Reflection workspace" title="Weekly Review" description="A clear, explainable summary of your work, habits, focus, wellbeing, and friction." />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className={`${card} overflow-hidden p-5 sm:p-7`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  <CalendarRange className="h-4 w-4" /> Weekly snapshot
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{review?.score_label ?? "Build your weekly story"}</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{review ? rangeLabel(review.period_start, review.period_end) : "Loading the signals across your workspace."}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05]">
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button type="button" disabled={weekOffset === 0} onClick={() => setWeekOffset((value) => Math.min(0, value + 1))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05]">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => void loadReview()} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white transition hover:scale-105 dark:bg-white dark:text-slate-950" aria-label="Refresh weekly review">
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </section>

          {error ? <section className={`${card} border-rose-200 p-6 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300`}>{error}</section> : null}

          {loading && !review ? (
            <section className={`${card} grid min-h-[420px] place-items-center`}><RefreshCw className="h-8 w-8 animate-spin text-indigo-500" /></section>
          ) : review ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_repeat(4,minmax(0,1fr))]">
                <article className={`${card} relative overflow-hidden p-6`}>
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Weekly score</p>
                  <div className="mt-4 flex items-end gap-2"><span className="text-6xl font-black tracking-tighter">{review.score}</span><span className="pb-2 text-sm font-bold text-slate-400">/ 100</span></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" style={{ width: `${review.score}%` }} /></div>
                </article>
                {review.metrics.map((metric) => (
                  <article key={metric.label} className={`${card} p-5`}>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{metric.label}</p>
                    <p className="mt-4 text-3xl font-black tracking-tight">{metric.display_value}</p>
                    <div className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${metric.change === null ? "text-slate-400" : metric.change >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                      {metric.change === null ? <Target className="h-3.5 w-3.5" /> : metric.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {metric.change === null ? "New baseline" : `${Math.abs(metric.change)}% ${metric.change >= 0 ? "up" : "down"}`} {metric.change_label}
                    </div>
                  </article>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
                <article className={`${card} p-5 sm:p-7`}>
                  <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Daily rhythm</p><h2 className="mt-2 text-2xl font-black">Momentum across the week</h2></div><Award className="h-6 w-6 text-amber-500" /></div>
                  <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-3">
                    {review.daily_breakdown.map((day) => (
                      <div key={day.date} className="min-w-0 text-center">
                        <div className="flex h-44 items-end rounded-2xl bg-slate-100 p-1.5 dark:bg-white/[0.05]"><div className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-cyan-400 transition-all" style={{ height: `${Math.max(day.score ? 10 : 2, day.score)}%` }} /></div>
                        <p className="mt-2 text-xs font-black">{day.label}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{day.score}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.035]"><p className="text-xs font-bold text-slate-400">Best day</p><p className="mt-1 font-black">{review.best_day ?? "Not enough data"}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.035]"><p className="text-xs font-bold text-slate-400">Productive window</p><p className="mt-1 font-black">{review.most_productive_window ?? "Still learning"}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.035]"><p className="text-xs font-bold text-slate-400">Main distraction</p><p className="mt-1 font-black">{review.biggest_distraction ?? "None logged"}</p></div>
                  </div>
                </article>

                <article className={`${card} p-5 sm:p-7`}>
                  <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/12 text-violet-600 dark:text-violet-300"><Brain className="h-6 w-6" /></span><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Flow Assistant</p><h2 className="text-xl font-black">{review.insight.title}</h2></div></div>
                  <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{review.insight.message}</p>
                  <button type="button" onClick={() => router.push(review.insight.action_href)} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200 dark:hover:bg-indigo-500/25">{review.insight.action_label}<ArrowRight className="h-4 w-4" /></button>
                  <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-blue-500/8 p-4"><Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-300" /><p className="mt-2 text-xs font-bold text-slate-400">Average sleep</p><p className="mt-1 font-black">{review.average_sleep_hours === null ? "No data" : `${review.average_sleep_hours}h`}</p></div><div className="rounded-2xl bg-amber-500/8 p-4"><Flame className="h-4 w-4 text-amber-600 dark:text-amber-300" /><p className="mt-2 text-xs font-bold text-slate-400">Average energy</p><p className="mt-1 font-black">{review.average_energy === null ? "No data" : `${review.average_energy}/5`}</p></div></div>
                </article>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <article className={`${card} p-6`}><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-emerald-500" /><h2 className="text-xl font-black">What worked</h2></div><div className="mt-5 space-y-3">{review.strengths.map((item) => <div key={item} className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950 dark:border-emerald-500/15 dark:bg-emerald-500/[0.07] dark:text-emerald-100">{item}</div>)}</div></article>
                <article className={`${card} p-6`}><div className="flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-amber-500" /><h2 className="text-xl font-black">Watch next week</h2></div><div className="mt-5 space-y-3">{review.watchouts.map((item) => <div key={item} className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/15 dark:bg-amber-500/[0.07] dark:text-amber-100">{item}</div>)}</div></article>
              </section>
            </>
          ) : null}
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
