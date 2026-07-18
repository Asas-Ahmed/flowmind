"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock3, Flame, RefreshCw, Sparkles, Target, type LucideIcon } from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getProductivityHeatmap } from "@/lib/api";
import type { ProductivityHeatmapDay, ProductivityHeatmapWorkspace } from "@/types/productivity-heatmap";

const card = "rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#11141f] dark:shadow-black/20";
const levelClass = [
  "bg-slate-100 dark:bg-white/[0.06]",
  "bg-cyan-200 dark:bg-cyan-950",
  "bg-sky-400 dark:bg-sky-800",
  "bg-indigo-500 dark:bg-indigo-600",
  "bg-violet-700 dark:bg-violet-500",
];

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder ? `${remainder}m` : ""}`.trim() : `${remainder}m`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function ProductivityHeatmapShell() {
  const [workspace, setWorkspace] = useState<ProductivityHeatmapWorkspace | null>(null);
  const [selectedDay, setSelectedDay] = useState<ProductivityHeatmapDay | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async (requestedYear: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await getProductivityHeatmap(requestedYear);
      setWorkspace(result);
      const today = new Date().toISOString().slice(0, 10);
      setSelectedDay(result.days.find((day) => day.date === today) ?? result.days.findLast((day) => day.score > 0) ?? result.days[0]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load productivity heatmap.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadWorkspace(year), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspace, year]);

  const summaryCards: Array<{ label: string; value: string | number; icon: LucideIcon }> = workspace
    ? [
        { label: "Active days", value: workspace.summary.active_days, icon: CalendarDays },
        { label: "Average score", value: workspace.summary.average_score, icon: Target },
        { label: "Current streak", value: `${workspace.summary.current_streak} days`, icon: Flame },
        { label: "Tasks completed", value: workspace.summary.total_tasks, icon: CheckCircle2 },
        { label: "Focus time", value: formatMinutes(workspace.summary.total_focus_minutes), icon: Clock3 },
      ]
    : [];

  const weeks = useMemo(() => {
    if (!workspace) return [];
    const first = new Date(`${workspace.days[0].date}T12:00:00`);
    const padding = Array.from({ length: first.getDay() }, () => null);
    const cells: Array<ProductivityHeatmapDay | null> = [...padding, ...workspace.days];
    const result: Array<Array<ProductivityHeatmapDay | null>> = [];
    for (let index = 0; index < cells.length; index += 7) result.push(cells.slice(index, index + 7));
    return result;
  }, [workspace]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar insightTitle="Year in focus" insightText="See how tasks, focus, habits, energy, and sleep combine into a transparent daily productivity signal." insightValue={workspace ? `${workspace.summary.active_days} active days` : "Ready"} />
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0">
        <WorkspaceTopbar eyebrow="Productivity history" title="Productivity Heatmap" description="Explore a full-year contribution calendar and open any day to understand exactly what shaped its score." />
        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className={`${card} relative overflow-hidden p-5 sm:p-7`}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300"><CalendarDays className="h-4 w-4" /> Your year, one day at a time</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Consistency becomes visible.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">Each square uses an explainable 0–100 score based on completed tasks, focus minutes, habit completions, and available wellbeing signals.</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none dark:border-white/10 dark:bg-white/[0.06]">
                  {(workspace?.available_years ?? [year]).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <button type="button" onClick={() => void loadWorkspace(year)} aria-label="Refresh heatmap" className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white transition hover:scale-105 dark:bg-white dark:text-slate-950"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
              </div>
            </div>
          </section>

          {error ? <section className={`${card} border-rose-200 p-6 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300`}>{error}</section> : null}

          {loading && !workspace ? <section className={`${card} grid min-h-[420px] place-items-center`}><RefreshCw className="h-8 w-8 animate-spin text-indigo-500" /></section> : workspace ? <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map(({ label, value, icon: Icon }) => <article key={label} className={`${card} p-5`}><Icon className="h-5 w-5 text-indigo-500" /><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p></article>)}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
              <article className={`${card} overflow-hidden p-5 sm:p-7`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Contribution calendar</p><h2 className="mt-2 text-2xl font-black">{year} productivity rhythm</h2></div><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span>Less</span>{levelClass.map((className, index) => <span key={index} className={`h-3 w-3 rounded-[4px] ${className}`} />)}<span>More</span></div></div>
                <div className="mt-7 overflow-x-auto pb-2">
                  <div className="grid min-w-[850px] grid-flow-col grid-rows-7 gap-1.5" style={{ gridAutoColumns: "14px" }}>
                    {weeks.flatMap((week, weekIndex) => week.map((day, dayIndex) => day ? <button key={day.date} type="button" title={`${dateLabel(day.date)} · Score ${day.score}`} onClick={() => setSelectedDay(day)} className={`h-3.5 w-3.5 rounded-[4px] ring-offset-2 transition hover:scale-125 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:ring-offset-[#11141f] ${levelClass[day.level]} ${selectedDay?.date === day.date ? "ring-2 ring-indigo-500" : ""}`} /> : <span key={`empty-${weekIndex}-${dayIndex}`} className="h-3.5 w-3.5" />))}
                  </div>
                </div>
              </article>

              <aside className={`${card} p-6`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Selected day</p>
                <h2 className="mt-2 text-xl font-black">{selectedDay ? dateLabel(selectedDay.date) : "Choose a day"}</h2>
                {selectedDay ? <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950"><p className="text-xs font-black uppercase tracking-[0.14em] opacity-60">Daily score</p><p className="mt-2 text-5xl font-black">{selectedDay.score}</p></div>
                  {[["Tasks", selectedDay.tasks_completed], ["Focus", formatMinutes(selectedDay.focus_minutes)], ["Habits", selectedDay.habit_completions], ["Energy", selectedDay.energy_average ?? "No check-in"], ["Sleep", selectedDay.sleep_hours ? `${selectedDay.sleep_hours}h · quality ${selectedDay.sleep_quality}/5` : "No record"]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/10"><span className="text-sm font-bold text-slate-500 dark:text-slate-400">{String(label)}</span><span className="text-sm font-black">{String(value)}</span></div>)}
                </div> : null}
              </aside>
            </section>

            <section className={`${card} flex flex-col gap-4 p-6 sm:flex-row sm:items-center`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Sparkles className="h-5 w-5" /></span><div><p className="font-black">{workspace.insight.title}</p><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{workspace.insight.message}</p></div></section>
          </> : null}
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
