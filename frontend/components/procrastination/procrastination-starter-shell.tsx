"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Footprints,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createProcrastinationStarter,
  deleteProcrastinationStarter,
  getProcrastinationWorkspace,
  toggleProcrastinationStarter,
} from "@/lib/api";
import type {
  ProcrastinationStarter,
  ProcrastinationWorkspace,
  StarterTechnique,
} from "@/types/procrastination";

const techniques: Array<{
  value: StarterTechnique;
  title: string;
  description: string;
  prompt: string;
  icon: typeof Zap;
}> = [
  {
    value: "two_minute_rule",
    title: "Two-minute rule",
    description: "Begin with an action that takes about two minutes.",
    prompt: "Open the task and do the first two-minute action",
    icon: Zap,
  },
  {
    value: "smallest_step",
    title: "Smallest step",
    description: "Shrink the task until the first move feels obvious.",
    prompt: "Write the smallest visible next action",
    icon: Footprints,
  },
  {
    value: "timebox",
    title: "Short timebox",
    description: "Commit only to a small, limited starting block.",
    prompt: "Work on the task for five minutes only",
    icon: Clock3,
  },
  {
    value: "remove_friction",
    title: "Remove friction",
    description: "Prepare the environment before asking for effort.",
    prompt: "Open every file and tool needed to begin",
    icon: WandSparkles,
  },
  {
    value: "easy_entry",
    title: "Easy entry",
    description: "Start with the easiest useful part, not the hardest.",
    prompt: "Complete the easiest useful section first",
    icon: Sparkles,
  },
];

function techniqueLabel(value: StarterTechnique | null) {
  if (!value) return "Not yet";
  return techniques.find((item) => item.value === value)?.title ?? value;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-violet-600 dark:bg-white/[0.07] dark:text-cyan-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function ProcrastinationStarterShell() {
  const [workspace, setWorkspace] = useState<ProcrastinationWorkspace | null>(null);
  const [taskName, setTaskName] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [technique, setTechnique] = useState<StarterTechnique>("smallest_step");
  const [firstStep, setFirstStep] = useState("");
  const [starterMinutes, setStarterMinutes] = useState(5);
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getProcrastinationWorkspace());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load starter plans");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProcrastinationWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load starter plans");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTechnique = useMemo(
    () => techniques.find((item) => item.value === technique) ?? techniques[0],
    [technique],
  );

  function useSuggestedStep() {
    setFirstStep(selectedTechnique.prompt);
    setSaved(false);
  }

  async function saveStarter() {
    if (!taskName.trim() || !firstStep.trim()) {
      setError("Add the avoided task and one clear first step.");
      return;
    }

    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await createProcrastinationStarter({
        task_name: taskName.trim(),
        obstacle: obstacle.trim() || null,
        technique,
        first_step: firstStep.trim(),
        starter_minutes: starterMinutes,
      });
      setTaskName("");
      setObstacle("");
      setFirstStep("");
      setSaved(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save this starter plan");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStarter(starter: ProcrastinationStarter) {
    setUpdatingId(starter.id);
    setError("");
    try {
      await toggleProcrastinationStarter(starter.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update this starter plan");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeStarter(starter: ProcrastinationStarter) {
    if (!window.confirm(`Delete the starter plan for “${starter.task_name}”?`)) return;
    setUpdatingId(starter.id);
    setError("");
    try {
      await deleteProcrastinationStarter(starter.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete this starter plan");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Start smaller"
        insightText="FlowMind reduces avoided work into one visible action. The goal is momentum, not finishing everything at once."
        insightValue={`${workspace?.active_starters ?? 0} active`}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar
          eyebrow="Momentum tools"
          title="Anti-Procrastination Starter"
          description="Turn an overwhelming task into a small, time-limited first action that is easier to begin."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh starter plans"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          }
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-6 sm:px-6 xl:px-8 xl:pb-10">
          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button>
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard icon={ListChecks} label="Starter plans" value={`${workspace?.total_starters ?? 0}`} detail="Tasks reduced into a practical first action" />
            <StatCard icon={CheckCircle2} label="Completed starts" value={`${workspace?.completed_starters ?? 0}`} detail="Plans where you successfully created momentum" />
            <StatCard icon={Target} label="Completion rate" value={`${workspace?.completion_rate ?? 0}%`} detail="Completed starter plans across your history" />
            <StatCard icon={Lightbulb} label="Most-used method" value={techniqueLabel(workspace?.most_used_technique ?? null)} detail="The technique you choose most often" />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Build a starter</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What are you avoiding?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Do not plan the entire task. Define only the smallest useful action that creates movement.</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Avoided task</span>
                  <input value={taskName} onChange={(event) => { setTaskName(event.target.value); setSaved(false); }} placeholder="Example: Write dissertation literature review" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-[#111522] dark:focus:border-cyan-400/50" />
                </label>
                <label className="md:col-span-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">What makes starting difficult? <span className="font-medium text-slate-400">Optional</span></span>
                  <textarea value={obstacle} onChange={(event) => setObstacle(event.target.value)} placeholder="Example: I do not know which paper to start with" rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-[#111522] dark:focus:border-cyan-400/50" />
                </label>
              </div>

              <p className="mt-6 text-sm font-bold text-slate-800 dark:text-slate-200">Choose a starting technique</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {techniques.map((item) => {
                  const Icon = item.icon;
                  const active = technique === item.value;
                  return (
                    <button key={item.value} type="button" onClick={() => { setTechnique(item.value); setSaved(false); }} className={`rounded-2xl border p-4 text-left transition ${active ? "border-violet-400 bg-violet-50 ring-4 ring-violet-500/10 dark:border-cyan-400/40 dark:bg-cyan-400/[0.08]" : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.025]"}`}>
                      <Icon className={`h-5 w-5 ${active ? "text-violet-600 dark:text-cyan-300" : "text-slate-400"}`} />
                      <span className="mt-3 block text-sm font-black">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-cyan-400/15 dark:bg-cyan-400/[0.055]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600 dark:text-cyan-300">Suggested first step</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedTechnique.prompt}</p>
                  </div>
                  <button type="button" onClick={useSuggestedStep} className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-violet-700 shadow-sm transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-cyan-200">Use suggestion</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Your exact first step</span>
                  <input value={firstStep} onChange={(event) => { setFirstStep(event.target.value); setSaved(false); }} placeholder="Example: Open one paper and write three bullet notes" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-[#111522] dark:focus:border-cyan-400/50" />
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Starter time</span>
                  <select value={starterMinutes} onChange={(event) => setStarterMinutes(Number(event.target.value))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none dark:border-white/10 dark:bg-[#111522]">
                    {[2, 5, 10, 15, 20, 25].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
                  </select>
                </label>
              </div>

              <button type="button" disabled={busy} onClick={() => void saveStarter()} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {busy ? "Saving starter..." : "Create starter plan"}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
              {saved && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-300"><Check className="h-4 w-4" /> Starter plan saved. Begin only the first step.</p>}
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 shadow-sm dark:border-white/10 dark:from-violet-500/[0.08] dark:via-white/[0.035] dark:to-cyan-400/[0.07]">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm dark:bg-white/10 dark:text-cyan-300"><Sparkles className="h-5 w-5" /></div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Flow Assistant</p>
                <h3 className="mt-2 text-xl font-black">{workspace?.insight.title ?? "Starting is the only goal"}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace?.insight.message ?? "Make one task small enough to begin without negotiation."}</p>
                <div className="mt-4 rounded-2xl border border-white bg-white/75 p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200">{workspace?.insight.next_action ?? "Choose one visible action that takes five minutes or less."}</div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Starter formula</p>
                <div className="mt-4 space-y-3">
                  {["Name the avoided task", "Identify the starting friction", "Choose one tiny visible action", "Commit to a short timebox", "Mark the start as completed"].map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.035]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">{index + 1}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Saved starts</p>
                <h2 className="mt-1 text-2xl font-black">Momentum history</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{workspace?.active_starters ?? 0} starter plans still active</p>
            </div>

            <div className="mt-5 space-y-3">
              {(workspace?.starters ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-white/15">
                  <Footprints className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 font-black">No starter plans yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create one tiny first step above to reduce the pressure of beginning.</p>
                </div>
              ) : (
                workspace?.starters.map((starter) => (
                  <article key={starter.id} className={`rounded-2xl border p-4 transition ${starter.is_completed ? "border-emerald-200 bg-emerald-50/55 dark:border-emerald-400/15 dark:bg-emerald-400/[0.055]" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.025]"}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${starter.is_completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-violet-100 text-violet-700 dark:bg-cyan-400/10 dark:text-cyan-300"}`}>{starter.is_completed ? "Started" : techniqueLabel(starter.technique)}</span>
                          <span className="text-xs font-bold text-slate-400">{starter.starter_minutes} min</span>
                        </div>
                        <h3 className={`mt-2 text-base font-black ${starter.is_completed ? "text-slate-500 line-through dark:text-slate-500" : "text-slate-950 dark:text-white"}`}>{starter.task_name}</h3>
                        <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-500 dark:text-cyan-300" />{starter.first_step}</p>
                        {starter.obstacle && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Starting friction: {starter.obstacle}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" disabled={updatingId === starter.id} onClick={() => void toggleStarter(starter)} className={`rounded-xl px-3 py-2 text-xs font-black transition disabled:opacity-50 ${starter.is_completed ? "border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"}`}>{starter.is_completed ? "Reopen" : "I started"}</button>
                        <button type="button" disabled={updatingId === starter.id} onClick={() => void removeStarter(starter)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-rose-400/20 dark:hover:text-rose-300" aria-label={`Delete ${starter.task_name}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
