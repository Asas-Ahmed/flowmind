"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BrainCircuit, CalendarRange, CheckCircle2, ChevronRight, FlaskConical, Lightbulb, RefreshCw, ShieldAlert, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getWeeklyCoach } from "@/lib/api";
import type { WeeklyCoach } from "@/types/weekly-coach";

const card = "rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#11141f] dark:shadow-black/20";

function rangeLabel(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function WeeklyCoachShell() {
  const router = useRouter();
  const [coach, setCoach] = useState<WeeklyCoach | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCoach = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCoach(await getWeeklyCoach(weekOffset));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create your weekly coaching brief.");
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadCoach(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCoach]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar insightTitle="Weekly coaching" insightText="Turn your own productivity records into a small, explainable plan for the next week." insightValue={coach ? coach.confidence : "Ready"} />
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0">
        <WorkspaceTopbar eyebrow="Explainable guidance" title="AI Weekly Coach" description="Strengths, friction, prioritized actions, and a small experiment generated from your FlowMind activity." />
        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className={`${card} relative overflow-hidden p-5 sm:p-8`}>
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300"><BrainCircuit className="h-4 w-4" /> Weekly coaching brief</div>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{coach?.headline ?? "Building your coaching brief"}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{coach?.summary ?? "Connecting your weekly tasks, focus, habits, tracked time, recovery, and distraction signals."}</p>
                {coach ? <p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400"><CalendarRange className="h-4 w-4" />{rangeLabel(coach.period_start, coach.period_end)}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setWeekOffset((value) => value - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm dark:border-white/10 dark:bg-white/[0.05]"><ArrowLeft className="h-4 w-4" />Previous</button>
                <button type="button" disabled={weekOffset === 0} onClick={() => setWeekOffset((value) => Math.min(0, value + 1))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.05]">Next<ArrowRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => void loadCoach()} aria-label="Refresh weekly coach" className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
              </div>
            </div>
          </section>

          {error ? <section className={`${card} border-rose-200 p-6 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300`}>{error}</section> : null}
          {loading && !coach ? <section className={`${card} grid min-h-[420px] place-items-center`}><RefreshCw className="h-8 w-8 animate-spin text-violet-500" /></section> : null}

          {coach ? <>
            <section className="grid gap-4 sm:grid-cols-3">
              <article className={`${card} p-6`}><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Weekly score</p><p className="mt-3 text-5xl font-black">{coach.score}<span className="text-lg text-slate-400">/100</span></p></article>
              <article className={`${card} p-6`}><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Signal confidence</p><p className="mt-3 text-3xl font-black">{coach.confidence}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Based on how many connected modules contained usable records.</p></article>
              <article className={`${card} p-6`}><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Primary goal</p><p className="mt-3 text-xl font-black">One better week, not a perfect week</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">The coach limits advice to practical, testable changes.</p></article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className={`${card} p-6 sm:p-7`}><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><h2 className="text-xl font-black">Strengths to repeat</h2></div><div className="mt-5 space-y-3">{coach.strengths.map((item) => <div key={item.title} className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-500/15 dark:bg-emerald-500/[0.07]"><p className="font-black text-emerald-950 dark:text-emerald-100">{item.title}</p><p className="mt-2 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/75">{item.detail}</p><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-emerald-700/60 dark:text-emerald-300/60">Evidence: {item.evidence}</p></div>)}</div></article>
              <article className={`${card} p-6 sm:p-7`}><div className="flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-amber-500" /><h2 className="text-xl font-black">Friction to reduce</h2></div><div className="mt-5 space-y-3">{coach.friction.map((item) => <div key={item.title} className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-500/15 dark:bg-amber-500/[0.07]"><p className="font-black text-amber-950 dark:text-amber-100">{item.title}</p><p className="mt-2 text-sm leading-6 text-amber-900/80 dark:text-amber-100/75">{item.detail}</p><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-amber-700/60 dark:text-amber-300/60">Evidence: {item.evidence}</p></div>)}</div></article>
            </section>

            <section className={`${card} p-6 sm:p-8`}><div className="flex items-center gap-3"><Target className="h-6 w-6 text-indigo-500" /><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Next-week plan</p><h2 className="mt-1 text-2xl font-black">Prioritized coaching actions</h2></div></div><div className="mt-6 grid gap-4 lg:grid-cols-2">{coach.actions.map((action, index) => <button key={action.title} type="button" onClick={() => router.push(action.action_href)} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-indigo-400/30"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-sm font-black text-indigo-600 dark:text-indigo-300">{index + 1}</span><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm dark:bg-white/[0.06] dark:text-slate-300">{action.priority}</span></div><h3 className="mt-4 text-lg font-black">{action.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.detail}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-300">{action.action_label}<ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>)}</div></section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <article className={`${card} p-6 sm:p-8`}><div className="flex items-center gap-3"><FlaskConical className="h-6 w-6 text-cyan-500" /><h2 className="text-2xl font-black">One-week experiment</h2></div><div className="mt-6 space-y-4"><div className="rounded-2xl bg-cyan-500/[0.07] p-5"><p className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Hypothesis</p><p className="mt-2 font-bold leading-7">{coach.experiment.hypothesis}</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/[0.035]"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Method</p><p className="mt-2 text-sm leading-6">{coach.experiment.method}</p></div><div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/[0.035]"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Success measure</p><p className="mt-2 text-sm leading-6">{coach.experiment.success_measure}</p></div></div></div></article>
              <article className={`${card} p-6 sm:p-8`}><div className="flex items-center gap-3"><Lightbulb className="h-6 w-6 text-violet-500" /><h2 className="text-2xl font-black">Reflection prompts</h2></div><div className="mt-6 space-y-3">{coach.reflection_questions.map((question) => <div key={question} className="flex gap-3 rounded-2xl bg-violet-500/[0.07] p-4"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" /><p className="text-sm font-bold leading-6">{question}</p></div>)}</div></article>
            </section>
            <p className="px-2 text-center text-xs leading-5 text-slate-400">{coach.disclaimer}</p>
          </> : null}
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
