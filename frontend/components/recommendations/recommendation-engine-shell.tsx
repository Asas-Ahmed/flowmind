"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getRecommendationWorkspace } from "@/lib/api";
import type {
  RecommendationPriority,
  RecommendationWorkspace,
} from "@/types/recommendation";

const card = "rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#11141f] dark:shadow-black/20";
const priorityStyle: Record<RecommendationPriority, string> = {
  high: "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-200",
  medium: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-amber-200",
  low: "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-200",
};

export function RecommendationEngineShell() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<RecommendationWorkspace | null>(null);
  const [horizonDays, setHorizonDays] = useState(7);
  const [priority, setPriority] = useState<"all" | RecommendationPriority>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWorkspace(await getRecommendationWorkspace(horizonDays));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not generate recommendations.");
    } finally {
      setLoading(false);
    }
  }, [horizonDays]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const visibleRecommendations = useMemo(() => {
    if (!workspace) return [];
    return priority === "all"
      ? workspace.recommendations
      : workspace.recommendations.filter((item) => item.priority === priority);
  }, [priority, workspace]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Recommendation Engine"
        insightText="Explainable guidance generated from your connected FlowMind activity and wellbeing signals."
        insightValue={workspace ? `${workspace.readiness_score}% ready` : "Ready"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0">
        <WorkspaceTopbar
          eyebrow="Adaptive productivity guidance"
          title="Recommendation Engine"
          description="Prioritized next actions with visible evidence, confidence, and direct links to the tools that can help."
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className={`${card} relative overflow-hidden p-6 sm:p-8`}>
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  <BrainCircuit className="h-4 w-4" /> Explainable intelligence
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                  {workspace?.headline ?? "Generating your next best actions"}
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {workspace?.summary ?? "Connecting tasks, focus, habits, schedule, recovery, capacity, and distraction signals."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[3, 7, 14, 30].map((value) => (
                  <button
                    key={value}
                    onClick={() => setHorizonDays(value)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black ${horizonDays === value ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.05]"}`}
                  >
                    {value} days
                  </button>
                ))}
                <button
                  onClick={() => void load()}
                  aria-label="Refresh recommendations"
                  className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-white"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <section className={`${card} border-rose-200 p-6 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300`}>
              {error}
            </section>
          ) : null}

          {loading && !workspace ? (
            <section className={`${card} grid min-h-[420px] place-items-center`}>
              <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
            </section>
          ) : null}

          {workspace ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className={`${card} p-6`}>
                  <Gauge className="h-5 w-5 text-violet-500" />
                  <p className="mt-4 text-4xl font-black">{workspace.readiness_score}%</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">recommendation readiness</p>
                </article>
                <article className={`${card} p-6`}>
                  <Database className="h-5 w-5 text-indigo-500" />
                  <p className="mt-4 text-4xl font-black">{workspace.signals_analyzed}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">signals analyzed</p>
                </article>
                <article className={`${card} p-6`}>
                  <Sparkles className="h-5 w-5 text-cyan-500" />
                  <p className="mt-4 text-4xl font-black">{workspace.recommendations.length}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">actions generated</p>
                </article>
                <article className={`${card} p-6`}>
                  <TriangleAlert className="h-5 w-5 text-rose-500" />
                  <p className="mt-4 text-4xl font-black">{workspace.high_priority_count}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">high priority</p>
                </article>
              </section>

              <section className={`${card} p-4 sm:p-5`}>
                <div className="flex flex-wrap gap-2">
                  {(["all", "high", "medium", "low"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setPriority(value)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-black capitalize ${priority === value ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300"}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                {visibleRecommendations.map((recommendation, index) => (
                  <motion.article
                    key={recommendation.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`${card} flex flex-col p-6 sm:p-7`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                          {recommendation.category}
                        </span>
                        <h2 className="mt-4 text-xl font-black">{recommendation.title}</h2>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${priorityStyle[recommendation.priority]}`}>
                        {recommendation.priority}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-500/15 dark:bg-violet-500/[0.07]">
                      <div className="flex gap-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                        <p className="font-black leading-7">{recommendation.message}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {recommendation.reason}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {recommendation.evidence.map((item) => (
                        <div key={item.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.035]">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                          <p className="mt-2 text-lg font-black">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        {recommendation.confidence} confidence · {recommendation.impact}
                      </div>
                      <button
                        onClick={() => router.push(recommendation.action.href)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                      >
                        {recommendation.action.label}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </section>

              {!visibleRecommendations.length ? (
                <section className={`${card} grid min-h-[260px] place-items-center p-8 text-center`}>
                  <div>
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                    <h2 className="mt-4 text-2xl font-black">No recommendations in this priority</h2>
                    <p className="mt-2 text-sm text-slate-500">Choose another filter to see the available guidance.</p>
                  </div>
                </section>
              ) : null}

              {workspace.data_gaps.length ? (
                <section className={`${card} p-6 sm:p-8`}>
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="h-5 w-5 text-cyan-500" />
                    <h2 className="text-xl font-black">Improve recommendation quality</h2>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {workspace.data_gaps.map((gap) => (
                      <div key={gap} className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm font-semibold leading-6 dark:border-cyan-500/15 dark:bg-cyan-500/[0.07]">
                        {gap}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <p className="px-2 text-center text-xs leading-5 text-slate-400">{workspace.disclaimer}</p>
            </>
          ) : null}
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
