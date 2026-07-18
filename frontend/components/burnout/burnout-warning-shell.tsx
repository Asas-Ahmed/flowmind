"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BatteryCharging,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getBurnoutWorkspace } from "@/lib/api";
import type { BurnoutSignal, BurnoutWorkspace } from "@/types/burnout";

const signalIcons = {
  tasks: CalendarClock,
  energy: BatteryCharging,
  sleep: TimerReset,
  cognitive: BrainCircuit,
  focus: HeartPulse,
} as const;

function riskLabel(score: number) {
  if (score >= 65) return "High warning";
  if (score >= 35) return "Moderate warning";
  return "Low warning";
}

function SignalCard({ signal }: { signal: BurnoutSignal }) {
  const Icon = signalIcons[signal.key as keyof typeof signalIcons] ?? ShieldAlert;
  const width = `${Math.min(100, Math.round((signal.score / signal.max_score) * 100))}%`;
  const accent = signal.tone === "high"
    ? "from-rose-500 to-orange-400"
    : signal.tone === "attention"
      ? "from-amber-500 to-orange-400"
      : signal.tone === "positive"
        ? "from-emerald-500 to-cyan-400"
        : "from-violet-500 to-cyan-400";

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-violet-600 dark:bg-white/[0.07] dark:text-cyan-300">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-950 dark:text-white">{signal.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{signal.value}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-black text-slate-700 dark:text-slate-200">
          {signal.score}/{signal.max_score}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{signal.detail}</p>
    </article>
  );
}

export function BurnoutWarningShell() {
  const [workspace, setWorkspace] = useState<BurnoutWorkspace | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getBurnoutWorkspace());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load workload warning data");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getBurnoutWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load workload warning data");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxTrend = useMemo(() => {
    if (!workspace?.trend.length) return 100;
    return Math.max(100, ...workspace.trend.flatMap((point) => [point.workload, point.recovery]));
  }, [workspace]);

  async function refresh() {
    setRefreshing(true);
    await loadWorkspace();
    setRefreshing(false);
  }

  const riskScore = workspace?.risk_score ?? 0;
  const riskLevel = workspace?.risk_level ?? "low";
  const riskGradient = riskLevel === "high"
    ? "from-rose-600 via-orange-500 to-amber-400"
    : riskLevel === "moderate"
      ? "from-amber-500 via-orange-400 to-violet-500"
      : "from-emerald-500 via-cyan-500 to-violet-500";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Protect sustainable progress"
        insightText="This workspace highlights workload patterns, not a medical diagnosis. Use the signals to make smaller, earlier adjustments."
        insightValue={`${riskScore}/100`}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-10">
        <WorkspaceTopbar
          eyebrow="Wellbeing intelligence"
          title="Burnout & Workload Warning"
          description="Review explainable workload and recovery signals before pressure becomes harder to manage."
        />

        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={() => void refresh()} className="rounded-xl px-3 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/10">Retry</button>
            </div>
          )}

          <section className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${riskGradient} p-[1px] shadow-[0_24px_80px_rgba(76,29,149,0.16)]`}>
            <div className="relative overflow-hidden rounded-[31px] bg-slate-950 px-6 py-7 text-white sm:px-8 sm:py-9">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{riskLabel(riskScore)}</span>
                    <button type="button" disabled={refreshing} onClick={() => void refresh()} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-60">
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />Refresh signals
                    </button>
                  </div>
                  <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">{workspace?.headline ?? "Building your workload picture"}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{workspace?.summary ?? "FlowMind is combining your recent workload and recovery signals."}</p>
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-slate-300">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <p>{workspace?.disclaimer ?? "FlowMind identifies patterns only and does not provide a diagnosis."}</p>
                  </div>
                </div>

                <div className="mx-auto grid h-56 w-56 place-items-center rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-cyan-400 via-violet-500 to-rose-500 p-3 shadow-[0_0_60px_rgba(56,189,248,0.2)]">
                  <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center">
                    <div>
                      <p className="text-6xl font-black tracking-tight">{riskScore}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">warning score</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              [CheckCircle2, "Protective factors", String(workspace?.protective_factors ?? 0), "Signals currently supporting balance"],
              [AlertTriangle, "Warning signals", String(workspace?.warning_signals ?? 0), "Areas that may need adjustment"],
              [Sparkles, "Data coverage", `${workspace?.data_coverage ?? 0}%`, "How much recent data informs this view"],
            ].map(([Icon, label, value, detail]) => {
              const CardIcon = Icon as typeof CheckCircle2;
              return (
                <div key={String(label)} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                  <CardIcon className="h-5 w-5 text-violet-600 dark:text-cyan-300" />
                  <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{String(label)}</p>
                  <p className="mt-1 text-3xl font-black">{String(value)}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{String(detail)}</p>
                </div>
              );
            })}
          </section>

          <section className="mt-6 grid gap-6 2xl:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Explainable warning signals</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Each score shows how much that signal contributes to the overall warning.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {(workspace?.signals ?? []).map((signal) => <SignalCard key={signal.key} signal={signal} />)}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-cyan-300">Flow Assistant</p>
              <h2 className="mt-2 text-xl font-black">Recommended adjustments</h2>
              <div className="mt-5 space-y-3">
                {(workspace?.recommendations ?? []).map((recommendation, index) => (
                  <article key={`${recommendation.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black">{recommendation.title}</h3>
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{recommendation.priority.replace("_", " ")}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{recommendation.detail}</p>
                    <div className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-slate-800 dark:bg-white/[0.05] dark:text-slate-200">{recommendation.action}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div>
              <h2 className="text-xl font-black">Seven-day workload and recovery view</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A simple comparison of daily demand and available recovery evidence.</p>
            </div>
            <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-4">
              {(workspace?.trend ?? []).map((point) => (
                <div key={point.date} className="min-w-0 text-center">
                  <div className="flex h-44 items-end justify-center gap-1 rounded-2xl bg-slate-50 px-2 py-3 dark:bg-white/[0.025]">
                    <div className="w-3 rounded-t-full bg-gradient-to-t from-rose-500 to-amber-400 sm:w-5" style={{ height: `${Math.max(4, point.workload / maxTrend * 100)}%` }} title={`Workload ${point.workload}`} />
                    <div className="w-3 rounded-t-full bg-gradient-to-t from-violet-600 to-cyan-400 sm:w-5" style={{ height: `${Math.max(4, point.recovery / maxTrend * 100)}%` }} title={`Recovery ${point.recovery}`} />
                  </div>
                  <p className="mt-2 truncate text-[10px] font-bold uppercase text-slate-500 sm:text-xs">{new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Workload</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />Recovery</span>
            </div>
          </section>
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
