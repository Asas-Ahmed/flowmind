"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getProductivityData } from "@/lib/api";
import type {
  ProductivityComponent,
  ProductivityData,
  ProductivityRecommendation,
} from "@/types/productivity";

const card =
  "rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-black/20";

const componentIcons = {
  tasks: CheckCircle2,
  habits: Flame,
  focus: Clock3,
};

export function ProductivityShell() {
  const router = useRouter();
  const [data, setData] = useState<ProductivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProductivity = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await getProductivityData());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your productivity score.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getProductivityData()
      .then((productivityData) => {
        if (!cancelled) {
          setData(productivityData);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load your productivity score.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recentTrend = useMemo(() => data?.trend.slice(-14) ?? [], [data]);
  const maxTrendScore = Math.max(1, ...recentTrend.map((point) => point.score));
  const scoreChange = data?.score_change ?? 0;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50"
    >
      <div className="pointer-events-none fixed inset-0 soft-grid opacity-65" />
      <div className="pointer-events-none fixed left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-400/15 blur-3xl" />

      <WorkspaceSidebar
        insightTitle="Explainable score"
        insightText="Tasks contribute 40%, habits 30%, and focus 30%, with a small overdue-work penalty."
        insightValue="Live"
      />

      <div className="relative min-h-screen xl:pl-[272px]">
        <WorkspaceTopbar
          eyebrow="Smart productivity score"
          title="Understand what drives your day"
          description="A transparent score built from real task, habit, and focus activity."
          actions={
            <button
              type="button"
              onClick={() => void loadProductivity()}
              aria-label="Refresh productivity score"
              title="Refresh productivity score"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          }
        />

        <div className="mx-auto max-w-[1800px] space-y-6 px-4 pb-32 pt-6 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <section className="grid gap-6 2xl:grid-cols-[1.15fr_.85fr]">
            <article className={`${card} relative overflow-hidden p-6 sm:p-8`}>
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
                <ScoreRing score={data?.score ?? 0} loading={loading} />

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      {data?.level ?? "Calculating"}
                    </span>
                    <ScoreChange value={scoreChange} />
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Your daily productivity is explainable.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {data?.summary ??
                      "FlowMind is combining your latest task, habit, and focus activity."}
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <MiniStat
                      label="Data confidence"
                      value={data?.data_confidence ?? "—"}
                      helper={`${data?.active_days ?? 0} active days`}
                    />
                    <MiniStat
                      label="Previous score"
                      value={`${data?.previous_score ?? 0}%`}
                      helper="Yesterday"
                    />
                    <MiniStat
                      label="Penalty"
                      value={`-${data?.overdue_penalty ?? 0}`}
                      helper={`${data?.overdue_tasks ?? 0} overdue tasks`}
                    />
                  </div>
                </div>
              </div>
            </article>

            <article className={`${card} p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black">How the score works</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Weighted activity minus overdue pressure.
                  </p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                  <Brain className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <FormulaRow label="Task completion" value="40%" />
                <FormulaRow label="Habit consistency" value="30%" />
                <FormulaRow label="Focus goal" value="30%" />
                <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                  <FormulaRow
                    label="Overdue penalty"
                    value={`-${data?.overdue_penalty ?? 0} pts`}
                    danger
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400">
                FlowMind caps every component at 100%. The score is guidance, not a judgment of your personal worth or wellbeing.
              </div>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {(data?.components ?? []).map((component) => (
              <ComponentCard
                key={component.key}
                component={component}
                onOpen={() => router.push(component.action_href)}
              />
            ))}
            {!data?.components.length &&
              ["tasks", "habits", "focus"].map((key) => (
                <div key={key} className={`${card} h-72 animate-pulse p-6`} />
              ))}
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.25fr_.75fr]">
            <article className={`${card} p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black">14-day score trend</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    See how consistency develops over time.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                  <Activity className="h-4 w-4" />
                  Last 14 days
                </div>
              </div>

              {recentTrend.some((point) => point.score > 0) ? (
                <div className="mt-8 flex h-72 items-end gap-2 sm:gap-3">
                  {recentTrend.map((point) => (
                    <div key={point.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="pointer-events-none mb-1 hidden rounded-xl bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white group-hover:block dark:bg-white dark:text-slate-950">
                        {point.score}%
                      </div>
                      <div className="flex h-52 w-full items-end overflow-hidden rounded-full bg-slate-100 p-1 dark:bg-white/[0.06]">
                        {point.score > 0 && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{
                              height: `${Math.max(8, (point.score / maxTrendScore) * 100)}%`,
                            }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            className="w-full rounded-full aurora-gradient"
                          />
                        )}
                      </div>
                      <span className="hidden text-[10px] text-slate-500 sm:block">
                        {new Date(`${point.date}T00:00:00`).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </article>

            <article className={`${card} p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black">Best next actions</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Small actions with the clearest score impact.
                  </p>
                </div>
                <Target className="h-5 w-5 text-cyan-500" />
              </div>

              <div className="mt-6 space-y-3">
                {(data?.recommendations ?? []).map((recommendation) => (
                  <RecommendationCard
                    key={`${recommendation.title}-${recommendation.action_href}`}
                    recommendation={recommendation}
                    onOpen={() => router.push(recommendation.action_href)}
                  />
                ))}
              </div>
            </article>
          </section>
        </div>

        <WorkspaceNavigation variant="mobile" />
      </div>
    </motion.main>
  );
}

function ScoreRing({ score, loading }: { score: number; loading: boolean }) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <div className="mx-auto grid h-56 w-56 place-items-center rounded-full p-3 shadow-[0_25px_70px_rgba(79,70,229,0.18)]" style={{ background: `conic-gradient(#4a6ded 0deg, #c739e0 ${degrees * 0.72}deg, #3bf2fd ${degrees}deg, rgb(226 232 240 / 0.75) ${degrees}deg)` }}>
      <div className="grid h-full w-full place-items-center rounded-full bg-white shadow-inner dark:bg-[#090d1b]">
        <div className="text-center">
          <Gauge className="mx-auto h-6 w-6 text-cyan-500" />
          <p className="mt-3 text-6xl font-black tracking-tight">
            {loading ? "—" : score}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            out of 100
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreChange({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
        <ArrowUpRight className="h-3.5 w-3.5" />+{value} from yesterday
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
        <ArrowDownRight className="h-3.5 w-3.5" />{value} from yesterday
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
      No change from yesterday
    </span>
  );
}

function MiniStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.035]">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{helper}</p>
    </div>
  );
}

function FormulaRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <strong className={danger ? "text-rose-500" : "text-slate-950 dark:text-white"}>{value}</strong>
    </div>
  );
}

function ComponentCard({ component, onOpen }: { component: ProductivityComponent; onOpen: () => void }) {
  const Icon = componentIcons[component.key];
  const targetText = component.target
    ? `${component.current} / ${component.target} ${component.unit}`
    : `No ${component.unit} due today`;

  return (
    <article className={`${card} p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
          {component.weight}% weight
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{component.label}</p>
          <p className="mt-1 text-4xl font-black">{component.score}%</p>
        </div>
        <p className="text-right text-xs font-bold text-cyan-600 dark:text-cyan-300">
          +{component.weighted_points} pts
        </p>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${component.score}%` }}
          className="h-full rounded-full aurora-gradient"
        />
      </div>

      <p className="mt-4 text-xs font-bold text-slate-700 dark:text-slate-300">{targetText}</p>
      <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {component.explanation}
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:gap-3 dark:text-cyan-300"
      >
        {component.action_label}
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}

function RecommendationCard({ recommendation, onOpen }: { recommendation: ProductivityRecommendation; onOpen: () => void }) {
  const priorityStyles = {
    high: "border-rose-200 bg-rose-50/70 dark:border-rose-400/20 dark:bg-rose-400/[0.07]",
    medium: "border-amber-200 bg-amber-50/70 dark:border-amber-400/20 dark:bg-amber-400/[0.07]",
    low: "border-blue-200 bg-blue-50/70 dark:border-blue-400/20 dark:bg-blue-400/[0.07]",
    positive: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-400/[0.07]",
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${priorityStyles[recommendation.priority]}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{recommendation.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
            {recommendation.message}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">
            {recommendation.action_label}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex h-72 items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-300">
          <Activity className="h-6 w-6" />
        </div>
        <p className="mt-4 font-bold">No score activity yet</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Complete tasks, habits, or focus sessions to begin building your trend.
        </p>
      </div>
    </div>
  );
}
