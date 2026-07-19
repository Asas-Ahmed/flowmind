"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Grid3X3,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getDashboardData } from "@/lib/api";
import type { DashboardData } from "@/types/dashboard";

const card =
  "rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#11141f] dark:shadow-black/20";

const analyticsTools = [
  {
    title: "Deep Work Analytics",
    description: "Measure focus depth, session continuity, interruptions, and your strongest working patterns.",
    href: "/deep-work",
    icon: Waves,
    label: "Focus quality",
  },
  {
    title: "Productivity Heatmap",
    description: "Explore your yearly consistency using a GitHub-style activity view built from real productivity data.",
    href: "/productivity-heatmap",
    icon: Grid3X3,
    label: "Long-term consistency",
  },
  {
    title: "Weekly Review",
    description: "Review completed work, focus time, habits, trends, wins, risks, and next-week priorities.",
    href: "/weekly-review",
    icon: CalendarRange,
    label: "Weekly reflection",
  },
  {
    title: "Personal Patterns",
    description: "Discover explainable patterns across your tasks, habits, focus sessions, energy, and schedule.",
    href: "/personal-patterns",
    icon: Brain,
    label: "Behaviour insights",
  },
  {
    title: "Activity Timeline",
    description: "See a chronological view of the actions that shaped your recent productivity and wellbeing.",
    href: "/activity",
    icon: Activity,
    label: "Unified history",
  },
  {
    title: "Goals & Targets",
    description: "Compare weekly targets with actual progress and identify where your plan needs adjustment.",
    href: "/goals",
    icon: Target,
    label: "Target progress",
  },
] as const;

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining}m`;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function AnalyticsShell() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await getDashboardData());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load your analytics overview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadAnalytics(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAnalytics]);

  const weeklyMaximum = useMemo(
    () => Math.max(1, ...(data?.weekly_trend.map((point) => point.score) ?? [])),
    [data],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Analytics hub"
        insightText="Use the dashboard for today. Use Analytics when you want trends, patterns, comparisons, and reflection."
        insightValue={data ? `${data.productivity_score}/100` : "Ready"}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0"
      >
        <WorkspaceTopbar
          eyebrow="Productivity intelligence"
          title="Analytics"
          description="A dedicated home for trends, patterns, performance reviews, and deeper productivity insights."
          actions={
            <button
              type="button"
              onClick={() => void loadAnalytics()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh analytics"
              title="Refresh analytics"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          }
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className={`${card} relative overflow-hidden p-5 sm:p-7`}>
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  <Sparkles className="h-4 w-4" /> One place for deeper insight
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Keep today simple. Explore the bigger picture here.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  The dashboard remains your quick daily command centre. This separate analytics workspace brings together historical trends, focused-work quality, consistency, goals, and explainable personal patterns without overcrowding your home screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/weekly-review")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                Open weekly review <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {error ? (
            <section className={`${card} border-rose-200 p-5 text-sm font-semibold text-rose-600 dark:border-rose-500/20 dark:text-rose-300`}>
              {error}
            </section>
          ) : null}

          {loading && !data ? (
            <section className={`${card} grid min-h-[320px] place-items-center`}>
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            </section>
          ) : data ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Productivity score",
                    value: `${data.productivity_score}/100`,
                    detail: `${data.score_change >= 0 ? "+" : ""}${data.score_change} from the previous period`,
                    icon: TrendingUp,
                  },
                  {
                    label: "Task completion",
                    value: `${data.task_completion_rate}%`,
                    detail: `${data.completed_today} completed today`,
                    icon: CheckCircle2,
                  },
                  {
                    label: "Focus today",
                    value: formatMinutes(data.focus_minutes_today),
                    detail: `${data.focus_goal_rate}% of your daily goal`,
                    icon: Clock3,
                  },
                  {
                    label: "Habit completion",
                    value: `${data.habit_completion_rate}%`,
                    detail: `${data.habits_completed_today} of ${data.habits_due_today} due habits`,
                    icon: BarChart3,
                  },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <article key={metric.label} className={`${card} p-5`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{metric.label}</p>
                          <p className="mt-3 text-3xl font-black tracking-tight">{metric.value}</p>
                        </div>
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.detail}</p>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <article className={`${card} p-5 sm:p-7`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Seven-day overview</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight">Weekly productivity trend</h3>
                    </div>
                    <BarChart3 className="h-6 w-6 text-indigo-500" />
                  </div>

                  <div className="mt-8 grid h-56 grid-cols-7 items-end gap-2 sm:gap-4">
                    {data.weekly_trend.map((point) => (
                      <div key={point.date} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] font-bold tabular-nums text-slate-400">{point.score}</span>
                        <div className="flex h-full w-full items-end overflow-hidden rounded-xl bg-slate-100 dark:bg-white/[0.05]">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(6, (point.score / weeklyMaximum) * 100)}%` }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            className="w-full rounded-xl bg-gradient-to-t from-indigo-600 via-violet-500 to-cyan-400"
                            title={`${point.day}: score ${point.score}`}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{point.day.slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={`${card} p-5 sm:p-7`}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Flow Assistant insight</p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight">{data.insight.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{data.insight.message}</p>
                  <button
                    type="button"
                    onClick={() => router.push(data.insight.action_href)}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.05]"
                  >
                    {data.insight.action_label} <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              </section>
            </>
          ) : null}

          <section>
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Analytics workspaces</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">Choose the question you want to answer</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {analyticsTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <motion.button
                    key={tool.href}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => router.push(tool.href)}
                    className={`${card} group p-5 text-left transition hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-400/25`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                        <Icon className="h-6 w-6" />
                      </span>
                      <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-600" />
                    </div>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">{tool.label}</p>
                    <h4 className="mt-2 text-xl font-black tracking-tight">{tool.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{tool.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
