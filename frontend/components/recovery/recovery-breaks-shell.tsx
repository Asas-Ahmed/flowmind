"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CirclePause,
  Droplets,
  Eye,
  Footprints,
  HeartPulse,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TimerReset,
  Trash2,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { createRecoveryBreak, deleteRecoveryBreak, getRecoveryWorkspace } from "@/lib/api";
import type { RecoveryBreakType, RecoveryFeedback, RecoveryWorkspace } from "@/types/recovery";

const recoveryOptions: {
  id: RecoveryBreakType;
  label: string;
  description: string;
  duration: number;
  icon: typeof Wind;
  guidance: string[];
}[] = [
  { id: "breathing", label: "Deep breathing", description: "Slow your breathing and release tension.", duration: 2, icon: Wind, guidance: ["Sit comfortably and relax your shoulders.", "Breathe in slowly for four counts.", "Breathe out gently for six counts."] },
  { id: "stretching", label: "Stretching", description: "Reset your neck, shoulders, and wrists.", duration: 3, icon: Activity, guidance: ["Roll your shoulders backwards slowly.", "Gently stretch your neck on each side.", "Open and close your hands to relax your wrists."] },
  { id: "eye_care", label: "Eye care", description: "Look away from the screen and soften your gaze.", duration: 1, icon: Eye, guidance: ["Look at something far away.", "Blink slowly and relax your forehead.", "Keep your eyes away from the screen until the timer ends."] },
  { id: "water", label: "Water break", description: "Pause your work and hydrate calmly.", duration: 2, icon: Droplets, guidance: ["Stand up from your workspace.", "Drink water without rushing.", "Take one slow breath before returning."] },
  { id: "quiet_rest", label: "Quiet rest", description: "Take a short pause without stimulation.", duration: 3, icon: CirclePause, guidance: ["Put your phone face down.", "Let your attention settle without solving anything.", "Return only when the timer finishes."] },
  { id: "short_walk", label: "Short walk", description: "Move away from the desk for a few minutes.", duration: 5, icon: Footprints, guidance: ["Leave the immediate work area.", "Walk at a comfortable pace.", "Notice your breathing and posture as you move."] },
];

const labels: Record<RecoveryBreakType, string> = {
  breathing: "Deep breathing",
  stretching: "Stretching",
  eye_care: "Eye care",
  water: "Water break",
  quiet_rest: "Quiet rest",
  short_walk: "Short walk",
};

export function RecoveryBreaksShell() {
  const [workspace, setWorkspace] = useState<RecoveryWorkspace | null>(null);
  const [selected, setSelected] = useState(recoveryOptions[0]);
  const [secondsLeft, setSecondsLeft] = useState(recoveryOptions[0].duration * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    try {
      setError("");
      setWorkspace(await getRecoveryWorkspace());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load guided recovery breaks.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadWorkspace]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, secondsLeft]);

  function chooseBreak(option: (typeof recoveryOptions)[number]) {
    setSelected(option);
    setSecondsLeft(option.duration * 60);
    setRunning(false);
    setFinished(false);
    setNote("");
  }

  function resetTimer() {
    setSecondsLeft(selected.duration * 60);
    setRunning(false);
    setFinished(false);
  }

  async function saveFeedback(feedback: RecoveryFeedback) {
    setBusy(true);
    try {
      await createRecoveryBreak({
        break_type: selected.id,
        duration_minutes: selected.duration,
        feedback,
        note: note.trim() || undefined,
      });
      resetTimer();
      setNote("");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your recovery feedback.");
    } finally {
      setBusy(false);
    }
  }

  async function removeBreak(breakId: number) {
    setBusy(true);
    try {
      await deleteRecoveryBreak(breakId);
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the recovery break.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadWorkspace();
    setRefreshing(false);
  }

  const progress = ((selected.duration * 60 - secondsLeft) / (selected.duration * 60)) * 100;
  const timeLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const maxBreaks = useMemo(() => Math.max(...(workspace?.daily_points ?? []).map((point) => point.breaks), 1), [workspace]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Recover with intention"
        insightText="Use short breaks and feedback to learn which recovery choices support you best."
        insightValue={`${workspace?.helpful_rate ?? 0}% helpful`}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-10">
        <WorkspaceTopbar
          eyebrow="Wellbeing and recovery"
          title="Guided Recovery Breaks"
          description="Choose a short guided pause, complete it without pressure, and tell FlowMind whether it helped."
        />

        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={() => void refresh()} className="rounded-xl px-3 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/10">Retry</button>
            </div>
          )}

          <section className="relative overflow-hidden rounded-[32px] border border-violet-200/70 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600 p-6 text-white shadow-[0_24px_80px_rgba(124,58,237,0.22)] sm:p-8">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-100"><Sparkles className="h-4 w-4" /> Flow Assistant</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{workspace?.assistant_title ?? "Preparing your recovery workspace"}</h1>
                <p className="mt-3 text-sm leading-7 text-violet-50 sm:text-base">{workspace?.assistant_message ?? "Choose a short reset to begin."}</p>
                <p className="mt-4 text-xs leading-5 text-violet-100">Recovery guidance supports general wellbeing only and is not medical or mental-health treatment.</p>
              </div>
              <button type="button" disabled={refreshing} onClick={() => void refresh()} className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20 disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [HeartPulse, "Breaks today", String(workspace?.today_breaks ?? 0), `${workspace?.today_minutes ?? 0} recovery minutes`],
              [TimerReset, "Weekly recovery", `${workspace?.weekly_breaks ?? 0} breaks`, `${workspace?.weekly_minutes ?? 0} total minutes`],
              [Sparkles, "Helpful feedback", `${workspace?.helpful_rate ?? 0}%`, "Breaks marked as feeling better"],
              [Activity, "Recovery streak", `${workspace?.current_streak ?? 0} days`, `Suggested: ${labels[workspace?.recommended_type ?? "breathing"]}`],
            ].map(([Icon, label, value, detail]) => {
              const CardIcon = Icon as typeof HeartPulse;
              return (
                <article key={String(label)} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                  <CardIcon className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                  <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{String(label)}</p>
                  <p className="mt-1 text-3xl font-black">{String(value)}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{String(detail)}</p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Choose a recovery type</p>
                <h2 className="mt-2 text-2xl font-black">What would support you now?</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {recoveryOptions.map((option) => {
                  const Icon = option.icon;
                  const active = selected.id === option.id;
                  return (
                    <button key={option.id} type="button" onClick={() => chooseBreak(option)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-violet-300 bg-violet-50 shadow-sm dark:border-violet-400/30 dark:bg-violet-400/10" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.04]"}`}>
                      <div className="flex items-center justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"}`}><Icon className="h-5 w-5" /></span><span className="text-xs font-black text-slate-400">{option.duration} min</span></div>
                      <p className="mt-3 font-black">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="relative mx-auto grid h-52 w-52 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-white/[0.05]">
                  <div className="absolute inset-3 rounded-full border-[10px] border-slate-200 dark:border-white/[0.06]" />
                  <div className="absolute inset-3 rounded-full border-[10px] border-violet-500 transition-all" style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }} />
                  <div className="relative text-center"><p className="text-5xl font-black tabular-nums">{timeLabel}</p><p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{running ? "Recovering" : finished ? "Complete" : "Ready"}</p></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">{selected.label}</p>
                  <h2 className="mt-2 text-2xl font-black">Follow the guidance gently</h2>
                  <div className="mt-4 space-y-2">
                    {selected.guidance.map((step, index) => <div key={step} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-white/[0.035]"><span className="font-black text-violet-600 dark:text-violet-300">{index + 1}</span><span className="text-slate-600 dark:text-slate-300">{step}</span></div>)}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={() => setRunning((current) => !current)} disabled={finished} className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-slate-950">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pause" : "Start"}</button>
                    <button type="button" onClick={resetTimer} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10"><RotateCcw className="h-4 w-4" /> Reset</button>
                  </div>
                </div>
              </div>

              {finished && (
                <div className="mt-6 rounded-[24px] border border-violet-200 bg-violet-50 p-5 dark:border-violet-400/20 dark:bg-violet-400/10">
                  <h3 className="text-lg font-black">How do you feel now?</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your feedback helps FlowMind learn which recovery types are useful for you.</p>
                  <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} placeholder="Optional note" className="mt-4 w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-black/20" />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {(["better", "same", "worse"] as RecoveryFeedback[]).map((feedback) => <button key={feedback} type="button" disabled={busy} onClick={() => void saveFeedback(feedback)} className="rounded-2xl border border-violet-200 bg-white px-3 py-3 text-sm font-black capitalize transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05]">{feedback}</button>)}
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <h2 className="text-xl font-black">Seven-day recovery rhythm</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Completed breaks and the portion that felt helpful.</p>
              <div className="mt-6 flex h-52 items-end gap-3">
                {(workspace?.daily_points ?? []).map((point) => (
                  <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end justify-center rounded-xl bg-slate-100 px-1 dark:bg-white/[0.04]">
                      <div className="w-full rounded-lg bg-gradient-to-t from-violet-600 to-cyan-400" style={{ height: `${Math.max(8, (point.breaks / maxBreaks) * 100)}%` }} title={`${point.breaks} breaks, ${point.helpful_breaks} helpful`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <h2 className="text-xl font-black">What helps most</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Helpful-rate comparison from this week.</p>
              <div className="mt-5 space-y-4">
                {(workspace?.type_stats ?? []).map((stat) => (
                  <div key={stat.break_type}>
                    <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold">{labels[stat.break_type]}</span><span className="text-slate-500 dark:text-slate-400">{stat.sessions} sessions · {stat.helpful_rate}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${stat.helpful_rate}%` }} /></div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-xl font-black">Recent recovery history</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review or remove completed break records.</p>
            <div className="mt-5 space-y-3">
              {(workspace?.recent_breaks ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">Complete your first guided break to build a personal recovery pattern.</div>
              ) : workspace?.recent_breaks.map((record) => (
                <div key={record.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><HeartPulse className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="font-black">{labels[record.break_type]}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{record.duration_minutes} min · Felt {record.feedback} · {new Date(record.completed_at).toLocaleString()}{record.note ? ` · ${record.note}` : ""}</p></div>
                  <button type="button" disabled={busy} onClick={() => void removeBreak(record.id)} aria-label="Delete recovery break" className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
