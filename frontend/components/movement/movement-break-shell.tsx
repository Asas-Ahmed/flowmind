"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Droplets,
  Flame,
  Footprints,
  Pause,
  PersonStanding,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  StretchHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  deleteMovementBreak,
  getMovementWorkspace,
  recordMovementBreak,
} from "@/lib/api";
import type {
  MovementBreak,
  MovementRoutine,
  MovementWorkspace,
} from "@/types/movement";

const ROUTINES: Array<{
  id: MovementRoutine;
  title: string;
  description: string;
  duration: number;
  icon: typeof PersonStanding;
  steps: string[];
}> = [
  {
    id: "full_body",
    title: "Full-body reset",
    description: "A balanced two-minute routine after focused desk work.",
    duration: 120,
    icon: PersonStanding,
    steps: [
      "Stand tall and take two slow breaths.",
      "Roll both shoulders backwards five times.",
      "Reach both arms overhead and lengthen your spine.",
      "March gently in place for thirty seconds.",
    ],
  },
  {
    id: "shoulders_neck",
    title: "Shoulders & neck",
    description: "Release upper-body tension without forceful stretching.",
    duration: 90,
    icon: StretchHorizontal,
    steps: [
      "Lower your shoulders away from your ears.",
      "Turn your head slowly left, then right.",
      "Draw five relaxed shoulder circles backwards.",
      "Finish with one comfortable chest-opening stretch.",
    ],
  },
  {
    id: "wrists_hands",
    title: "Wrists & hands",
    description: "A quick reset for typing, writing, and mouse use.",
    duration: 60,
    icon: Activity,
    steps: [
      "Open and close your hands ten times.",
      "Circle both wrists slowly in each direction.",
      "Gently extend one palm forward, then switch sides.",
      "Shake out your hands and relax your grip.",
    ],
  },
  {
    id: "walk_water",
    title: "Walk & water",
    description: "Step away briefly and return refreshed.",
    duration: 120,
    icon: Droplets,
    steps: [
      "Stand up and walk away from the desk.",
      "Take a short lap around the room.",
      "Drink some water if available.",
      "Return with your shoulders relaxed.",
    ],
  },
  {
    id: "posture_reset",
    title: "Posture reset",
    description: "Reposition your body before the next work block.",
    duration: 75,
    icon: ShieldCheck,
    steps: [
      "Place both feet comfortably on the floor.",
      "Stack your head gently above your shoulders.",
      "Relax your jaw, hands, and upper back.",
      "Adjust your screen and chair before sitting again.",
    ],
  },
];

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function routineLabel(routine: MovementRoutine) {
  return ROUTINES.find((item) => item.id === routine)?.title ?? "Movement break";
}

export function MovementBreakShell() {
  const [workspace, setWorkspace] = useState<MovementWorkspace | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<MovementRoutine>("full_body");
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const routine = useMemo(
    () => ROUTINES.find((item) => item.id === selectedRoutine) ?? ROUTINES[0],
    [selectedRoutine],
  );

  const progress = routine.duration
    ? Math.min(100, ((routine.duration - secondsLeft) / routine.duration) * 100)
    : 0;

  const loadWorkspace = useCallback(async () => {
    try {
      const data = await getMovementWorkspace();
      setWorkspace(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the movement workspace",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMovementWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the movement workspace",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  function chooseRoutine(value: MovementRoutine) {
    const next = ROUTINES.find((item) => item.id === value) ?? ROUTINES[0];
    setSelectedRoutine(value);
    setSecondsLeft(next.duration);
    setRunning(false);
    setFinished(false);
  }

  function resetTimer() {
    setSecondsLeft(routine.duration);
    setRunning(false);
    setFinished(false);
  }

  async function handleDeleteBreak(item: MovementBreak) {
    const confirmed = window.confirm(
      `Delete the ${routineLabel(item.routine)} log? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    try {
      await deleteMovementBreak(item.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this movement break log",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function saveBreak(status: "completed" | "skipped") {
    setBusy(true);
    setError("");
    try {
      await recordMovementBreak({
        routine: selectedRoutine,
        status,
        duration_seconds:
          status === "completed" ? Math.max(1, routine.duration - secondsLeft) : 0,
      });
      resetTimer();
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this movement break",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Movement rhythm"
        insightText="Take a short movement reset after every two completed focus sessions."
        insightValue={workspace?.break_due ? "Break due" : "Tracking"}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-0 xl:pl-[280px]"
      >
        <WorkspaceTopbar
          eyebrow="Wellbeing workspace"
          title="Movement Break Coach"
          description="Use short, intentional movement breaks to reset after concentrated work."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh movement data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          }
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-6 sm:px-6 xl:px-8 xl:pb-10">
          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard icon={PersonStanding} label="Today" value={`${workspace?.today_completed ?? 0} breaks`} detail={`${workspace?.today_minutes ?? 0} active minutes`} />
            <StatCard icon={Footprints} label="This week" value={`${workspace?.weekly_completed ?? 0} breaks`} detail={`${workspace?.completion_rate ?? 0}% completion rate`} />
            <StatCard icon={Flame} label="Movement streak" value={`${workspace?.current_streak ?? 0} days`} detail={`Best: ${workspace?.best_streak ?? 0} days`} />
            <StatCard icon={Clock3} label="Next reminder" value={workspace?.break_due ? "Due now" : `${workspace?.sessions_until_break ?? 2} sessions`} detail={`${workspace?.focus_sessions_since_break ?? 0} focus sessions since last break`} />
          </section>

          <section className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${workspace?.break_due ? "border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:border-amber-400/25 dark:from-amber-400/10 dark:via-orange-400/[0.07] dark:to-rose-400/[0.06]" : "border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 dark:border-blue-400/20 dark:from-blue-500/10 dark:via-cyan-400/[0.06] dark:to-violet-500/[0.08]"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Flow Assistant</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                    {workspace?.break_due ? "You have earned a movement break." : "Keep your next reset nearby."}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {workspace?.break_due
                      ? `You completed ${workspace.focus_sessions_since_break} focused sessions since your last movement break. A short reset is recommended before continuing.`
                      : `FlowMind will recommend a break after two completed focus sessions. ${workspace?.sessions_until_break ?? 2} more session${workspace?.sessions_until_break === 1 ? "" : "s"} until the next reminder.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  chooseRoutine("full_body");
                  setRunning(true);
                }}
                className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                <Play className="h-4 w-4 fill-current" /> Start recommended reset
              </button>
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.07)] dark:border-white/[0.09] dark:bg-[#0a0e1a] dark:shadow-black/25">
              <div className="relative p-5 sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-300">
                    <routine.icon className="h-4 w-4" /> {routine.title}
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Move gently. Return refreshed.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{routine.description}</p>

                  <div className="relative mt-8 grid h-64 w-64 place-items-center rounded-full sm:h-72 sm:w-72" style={{ background: `conic-gradient(rgb(6 182 212) ${progress}%, rgba(148,163,184,.16) ${progress}% 100%)` }}>
                    <div className="grid h-[calc(100%-14px)] w-[calc(100%-14px)] place-items-center rounded-full bg-white shadow-inner dark:bg-[#0a0e1a]">
                      <div>
                        {finished ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /> : <PersonStanding className="mx-auto h-10 w-10 text-cyan-500" />}
                        <p className="mt-4 font-mono text-5xl font-black tracking-[-0.08em] sm:text-6xl">{formatTimer(secondsLeft)}</p>
                        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{finished ? "Routine complete" : `${Math.round(progress)}% complete`}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button type="button" disabled={busy || finished} onClick={() => setRunning((value) => !value)} className="flex min-w-32 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                      {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />} {running ? "Pause" : secondsLeft === routine.duration ? "Start" : "Resume"}
                    </button>
                    <button type="button" disabled={busy} onClick={resetTimer} className="flex min-w-32 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                      <RotateCcw className="h-4 w-4" /> Reset
                    </button>
                    <button type="button" disabled={busy || (!finished && secondsLeft === routine.duration)} onClick={() => void saveBreak("completed")} className="flex min-w-32 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" /> Complete
                    </button>
                    <button type="button" disabled={busy} onClick={() => void saveBreak("skipped")} className="flex min-w-32 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-500 transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                      <SkipForward className="h-4 w-4" /> Skip
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <h3 className="text-base font-black">Routine steps</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Move within a comfortable range. Stop if anything feels painful.</p>
                <div className="mt-5 space-y-3">
                  {routine.steps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-cyan-700 shadow-sm dark:bg-white/10 dark:text-cyan-300">{index + 1}</span>
                      <p className="pt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <h3 className="text-base font-black">Choose a reset</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
                  {ROUTINES.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === selectedRoutine;
                    return (
                      <button key={item.id} type="button" onClick={() => chooseRoutine(item.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/25 dark:bg-cyan-400/10" : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.04]"}`}>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-cyan-600 shadow-sm dark:bg-white/10 dark:text-cyan-300"><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0"><span className="block truncate text-sm font-bold">{item.title}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{Math.ceil(item.duration / 60)} min</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a] sm:p-6">
              <h2 className="text-lg font-black">Last 7 days</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Completed movement resets.</p>
              <div className="mt-6 flex h-44 items-end gap-2">
                {(workspace?.daily_points ?? []).map((point) => {
                  const highest = Math.max(...(workspace?.daily_points ?? []).map((item) => item.completed), 1);
                  const height = point.completed === 0 ? 0 : Math.max(14, (point.completed / highest) * 100);
                  return (
                    <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{point.completed || ""}</span>
                      <div className="flex h-28 w-full items-end rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">
                        <div className="w-full rounded-lg bg-gradient-to-t from-cyan-600 to-blue-400 transition-all" style={{ height: `${height}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase text-slate-500">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${point.date}T00:00:00`))}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a] sm:p-6">
              <h2 className="text-lg font-black">Recent movement history</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Completed and skipped reset prompts.</p>
              <div className="mt-5 divide-y divide-slate-100 dark:divide-white/[0.06]">
                {(workspace?.recent_breaks ?? []).length === 0 ? (
                  <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 text-center dark:border-white/10">
                    <div><PersonStanding className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-500">No movement history yet</p></div>
                  </div>
                ) : (
                  workspace?.recent_breaks.map((item) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      deleting={deletingId === item.id}
                      onDelete={() => handleDeleteBreak(item)}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}

type IconType = typeof PersonStanding;

function StatCard({ icon: Icon, label, value, detail }: { icon: IconType; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-3 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function HistoryRow({
  item,
  deleting,
  onDelete,
}: {
  item: MovementBreak;
  deleting: boolean;
  onDelete: () => void;
}) {
  const completed = item.status === "completed";
  return (
    <div className="flex items-center gap-3 py-4">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${completed ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-white/[0.05]"}`}>
        {completed ? <CheckCircle2 className="h-5 w-5" /> : <SkipForward className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{routineLabel(item.routine)}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.completed_at)} · {item.trigger_focus_sessions} focus sessions triggered</p></div>
      <div className="text-right"><p className={`text-xs font-bold capitalize ${completed ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400"}`}>{item.status}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{completed ? `${Math.max(1, Math.round(item.duration_seconds / 60))} min` : "Not counted"}</p></div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete ${routineLabel(item.routine)} log`}
        title="Delete log"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
      >
        {deleting ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
