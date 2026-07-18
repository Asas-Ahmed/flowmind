"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  History,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  TimerReset,
  Trash2,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import {
  cancelFocusSession,
  completeFocusSession,
  deleteFocusSession,
  getFocusWorkspace,
  pauseFocusSession,
  resumeFocusSession,
  startFocusSession,
} from "@/lib/api";
import type {
  FocusMode,
  FocusSession,
  FocusSessionPayload,
  FocusWorkspace,
} from "@/types/focus";

const PRESETS: Array<{ label: string; minutes: number; mode: FocusMode }> = [
  { label: "Quick", minutes: 15, mode: "focus" },
  { label: "Pomodoro", minutes: 25, mode: "focus" },
  { label: "Deep work", minutes: 50, mode: "focus" },
  { label: "Short break", minutes: 5, mode: "short_break" },
  { label: "Long break", minutes: 15, mode: "long_break" },
];

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function modeLabel(mode: FocusMode) {
  if (mode === "short_break") return "Short break";
  if (mode === "long_break") return "Long break";
  return "Focus";
}

function statusStyle(status: FocusSession["status"]) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (status === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300";
  }
  if (status === "paused") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300";
}

export function FocusShell() {
  const [workspace, setWorkspace] = useState<FocusWorkspace | null>(null);
  const [title, setTitle] = useState("Deep work session");
  const [mode, setMode] = useState<FocusMode>("focus");
  const [minutes, setMinutes] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeSession = workspace?.active_session ?? null;
  const totalSeconds = (activeSession?.planned_minutes ?? minutes) * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;

  const loadWorkspace = useCallback(async () => {
    try {
      const data = await getFocusWorkspace();
      setWorkspace(data);
      if (data.active_session) {
        setTitle(data.active_session.title);
        setMode(data.active_session.mode);
        setMinutes(data.active_session.planned_minutes);
        setElapsed(data.active_session.elapsed_seconds);
        setRunning(data.active_session.status === "active");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load focus workspace");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getFocusWorkspace()
      .then((data) => {
        if (cancelled) return;

        setWorkspace(data);

        if (data.active_session) {
          setTitle(data.active_session.title);
          setMode(data.active_session.mode);
          setMinutes(data.active_session.planned_minutes);
          setElapsed(data.active_session.elapsed_seconds);
          setRunning(data.active_session.status === "active");
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load focus workspace",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!running || !activeSession) return;
    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeSession, running]);

  useEffect(() => {
    if (!activeSession || activeSession.mode !== "focus" || remaining !== 0 || !running) return;
    void handleComplete();
    // handleComplete intentionally reacts only when the timer reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, activeSession]);

  const adaptive = workspace?.adaptive_recommendation;

  const goalPercent = useMemo(() => {
    if (!workspace?.daily_goal_minutes) return 0;
    return Math.min(100, (workspace.today_minutes / workspace.daily_goal_minutes) * 100);
  }, [workspace]);

  async function handleStart() {
    setBusy(true);
    setError("");
    const payload: FocusSessionPayload = {
      title: title.trim() || "Focus session",
      task_id: null,
      mode,
      planned_minutes: minutes,
    };
    try {
      const session = await startFocusSession(payload);
      setElapsed(session.elapsed_seconds);
      setRunning(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start session");
    } finally {
      setBusy(false);
    }
  }

  async function handlePause() {
    if (!activeSession) return;
    setBusy(true);
    setError("");
    try {
      await pauseFocusSession(activeSession.id, elapsed);
      setRunning(false);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to pause session");
    } finally {
      setBusy(false);
    }
  }

  async function handleResume() {
    if (!activeSession) return;
    setBusy(true);
    setError("");
    try {
      await resumeFocusSession(activeSession.id);
      setRunning(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to resume session");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!activeSession) return;
    setBusy(true);
    setError("");
    try {
      await completeFocusSession(activeSession.id, elapsed, note || null);
      setRunning(false);
      setElapsed(0);
      setNote("");
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to complete session");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!activeSession) return;
    setBusy(true);
    setError("");
    try {
      await cancelFocusSession(activeSession.id, elapsed, note || null);
      setRunning(false);
      setElapsed(0);
      setNote("");
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to cancel session");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(sessionId: number) {
    setBusy(true);
    setError("");
    try {
      await deleteFocusSession(sessionId);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete session");
    } finally {
      setBusy(false);
    }
  }

  function applyAdaptiveDuration() {
    if (activeSession || !adaptive) return;
    setMinutes(adaptive.recommended_minutes);
    setMode("focus");
    setElapsed(0);
  }

  function selectPreset(preset: (typeof PRESETS)[number]) {
    if (activeSession) return;
    setMinutes(preset.minutes);
    setMode(preset.mode);
    setElapsed(0);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Focus rhythm"
        insightText="Use focused intervals and intentional breaks to protect your energy."
        insightValue={workspace ? `${workspace.current_streak} day streak` : "Ready"}
      />

      <motion.main
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ 
          duration: 0.22, 
          ease: "easeOut", 
          }} 
        className="min-h-screen xl:pl-[272px]"
      >
        <WorkspaceTopbar
          eyebrow="Focus workspace"
          title="Protect your attention."
          description="Use structured focus sessions and understand your deep-work patterns."
          maxWidth="max-w-[1500px]"
          actions={
            <div className="hidden h-11 items-center rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 sm:flex">
              Today:
              <span className="ml-1.5 font-black text-slate-950 dark:text-white">
                {formatMinutes(workspace?.today_minutes ?? 0)}
              </span>
            </div>
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
            <StatCard icon={Clock3} label="Today" value={formatMinutes(workspace?.today_minutes ?? 0)} detail={`${workspace?.today_sessions ?? 0} completed sessions`} />
            <StatCard icon={BarChart3} label="This week" value={formatMinutes(workspace?.weekly_minutes ?? 0)} detail={`${workspace?.weekly_sessions ?? 0} focus blocks`} />
            <StatCard icon={Target} label="Completion" value={`${workspace?.completion_rate ?? 0}%`} detail="Completed vs. closed sessions" />
            <StatCard icon={Flame} label="Current streak" value={`${workspace?.current_streak ?? 0} days`} detail={`Best: ${workspace?.best_streak ?? 0} days`} />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.07)] dark:border-white/[0.09] dark:bg-[#0a0e1a] dark:shadow-black/25">
              <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400"><Sparkles className="h-4 w-4" /> {activeSession ? modeLabel(activeSession.mode) : modeLabel(mode)}</div>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{activeSession ? activeSession.title : "Start a focused work block"}</h2>
                    </div>
                    {activeSession && <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyle(activeSession.status)}`}>{activeSession.status}</span>}
                  </div>

                  <div className="mx-auto mt-8 flex max-w-xl flex-col items-center">
                    <div className="relative grid h-64 w-64 place-items-center rounded-full sm:h-72 sm:w-72" style={{ background: `conic-gradient(rgb(37 99 235) ${progress}%, rgba(148,163,184,.16) ${progress}% 100%)` }}>
                      <div className="grid h-[calc(100%-14px)] w-[calc(100%-14px)] place-items-center rounded-full bg-white shadow-inner dark:bg-[#0a0e1a]">
                        <div className="text-center">
                          <p className="font-mono text-5xl font-bold tracking-[-0.08em] sm:text-6xl">{formatTimer(activeSession ? remaining : minutes * 60)}</p>
                          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{activeSession ? `${Math.round(progress)}% complete` : `${minutes} minute ${modeLabel(mode).toLowerCase()}`}</p>
                        </div>
                      </div>
                    </div>

                    {!activeSession ? (
                      <div className="mt-8 w-full space-y-5">
                        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="What are you focusing on?" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:focus:border-blue-400" />
                        <div className="flex flex-wrap justify-center gap-2">
                          {PRESETS.map((preset) => {
                            const selected = preset.minutes === minutes && preset.mode === mode;
                            return <button key={`${preset.mode}-${preset.minutes}`} type="button" onClick={() => selectPreset(preset)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.07]"}`}>{preset.label} · {preset.minutes}m</button>;
                          })}
                        </div>
                        <button type="button" disabled={busy} onClick={handleStart} className="mx-auto flex min-w-52 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-white dark:text-slate-950"><Play className="h-4 w-4 fill-current" /> Start session</button>
                      </div>
                    ) : (
                      <div className="mt-8 w-full space-y-4">
                        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="Optional session note..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:focus:border-blue-400" />
                        <div className="flex flex-wrap justify-center gap-3">
                          {running ? <TimerButton label="Pause" icon={Pause} onClick={handlePause} disabled={busy} /> : <TimerButton label="Resume" icon={Play} onClick={handleResume} disabled={busy} />}
                          <TimerButton label="Complete" icon={CheckCircle2} onClick={handleComplete} disabled={busy} primary />
                          <TimerButton label="Cancel" icon={Square} onClick={handleCancel} disabled={busy} danger />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <div className="flex items-center justify-between"><div><p className="text-sm font-bold">Daily focus goal</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your target from profile settings</p></div><Target className="h-5 w-5 text-blue-500" /></div>
                <div className="mt-5 flex items-end justify-between"><span className="text-3xl font-bold">{workspace?.today_minutes ?? 0}<span className="ml-1 text-sm font-semibold text-slate-400">/ {workspace?.daily_goal_minutes ?? 120} min</span></span><span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(goalPercent)}%</span></div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-violet-500 to-fuchsia-500 transition-all" style={{ width: `${goalPercent}%` }} /></div>
              </div>

              <div className="rounded-[26px] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 shadow-sm dark:border-violet-400/20 dark:from-violet-500/10 dark:via-[#0a0e1a] dark:to-blue-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      Adaptive focus timer
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Learns from completed and cancelled focus sessions.
                    </p>
                  </div>
                  <span className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">
                    {adaptive?.confidence ?? "learning"}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Recommended duration</p>
                    <p className="mt-2 text-4xl font-black tracking-tight">{adaptive?.recommended_minutes ?? 25}<span className="ml-1 text-base font-semibold text-slate-400">min</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={applyAdaptiveDuration}
                    disabled={Boolean(activeSession) || !adaptive}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-slate-950"
                  >
                    Use duration
                  </button>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {adaptive?.message ?? "FlowMind is preparing your focus recommendation."}
                </p>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {(adaptive?.profiles ?? []).map((profile) => {
                    const selected = profile.minutes === adaptive?.recommended_minutes;
                    return (
                      <div
                        key={profile.minutes}
                        className={`rounded-xl border p-2.5 text-center ${selected ? "border-violet-300 bg-violet-100/70 dark:border-violet-400/30 dark:bg-violet-400/10" : "border-slate-200 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]"}`}
                      >
                        <p className="text-sm font-black">{profile.minutes}m</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {profile.sessions ? `${profile.completion_rate}% · ${profile.sessions}` : "No data"}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-[10px] leading-4 text-slate-400">
                  Based on {adaptive?.sample_size ?? 0} closed focus sessions. Recommendations remain explainable and improve as more sessions are recorded.
                </p>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <div className="flex items-center justify-between"><div><p className="text-sm font-bold">Last 7 days</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Completed focus minutes</p></div><BarChart3 className="h-5 w-5 text-violet-500" /></div>
                <div className="mt-6 flex h-44 items-end gap-2">
                  {(workspace?.daily_points ?? []).map((point) => {
                    const highest = Math.max(...(workspace?.daily_points ?? []).map((item) => item.minutes), 1);
                    const height = Math.max(8, (point.minutes / highest) * 100);
                    return <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[10px] font-semibold text-slate-400">{point.minutes || ""}</span><div className="flex h-28 w-full items-end rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]"><div className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-violet-400" style={{ height: `${height}%` }} /></div><span className="text-[10px] font-semibold uppercase text-slate-500">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${point.date}T00:00:00`))}</span></div>;
                  })}
                </div>
              </div>

              <div className="rounded-[26px] border border-blue-200/70 bg-gradient-to-br from-blue-50 to-violet-50 p-5 dark:border-blue-400/15 dark:from-blue-500/10 dark:to-violet-500/10">
                <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-300"><Sparkles className="h-5 w-5" /></div><div><p className="text-sm font-bold">Flow Assistant</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace && workspace.today_minutes >= workspace.daily_goal_minutes ? "You reached today’s focus goal. Protect your energy with a proper break." : workspace?.current_streak ? `You are on a ${workspace.current_streak}-day focus streak. One intentional session keeps it alive.` : "Start with one 25-minute block. Momentum matters more than a perfect plan."}</p></div></div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><History className="h-5 w-5 text-slate-500" /><h2 className="text-lg font-bold">Session history</h2></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your latest focus blocks and intentional breaks.</p></div><button type="button" onClick={() => void loadWorkspace()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.05]"><RotateCcw className="h-3.5 w-3.5" /> Refresh</button></div>
            <div className="mt-5 divide-y divide-slate-100 dark:divide-white/[0.06]">
              {(workspace?.recent_sessions ?? []).length === 0 ? <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 text-center dark:border-white/10"><div><TimerReset className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-500">No focus history yet</p></div></div> : workspace?.recent_sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">{session.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold">{session.title}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${statusStyle(session.status)}`}>{session.status}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{modeLabel(session.mode)} · {formatDate(session.started_at)}{session.note ? ` · ${session.note}` : ""}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-right"><p className="text-sm font-bold">{formatMinutes(Math.round(session.elapsed_seconds / 60))}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">of {session.planned_minutes}m</p></div>{!["active", "paused"].includes(session.status) && <button type="button" disabled={busy} onClick={() => void handleDelete(session.id)} aria-label="Delete session" className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}</div></div>)}
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}

type IconType = typeof Clock3;

function StatCard({ icon: Icon, label, value, detail }: { icon: IconType; label: string; value: string; detail: string }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"><Icon className="h-5 w-5" /></div></div></div>;
}

function TimerButton({ label, icon: Icon, onClick, disabled, primary = false, danger = false }: { label: string; icon: IconType; onClick: () => void; disabled: boolean; primary?: boolean; danger?: boolean }) {
  const style = primary ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : danger ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300" : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200";
  return <button type="button" disabled={disabled} onClick={onClick} className={`flex min-w-32 items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50 ${style}`}><Icon className="h-4 w-4" /> {label}</button>;
}
