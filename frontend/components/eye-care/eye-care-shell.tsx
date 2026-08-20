"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCircle2,
  CirclePause,
  Eye,
  EyeOff,
  Info,
  Play,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  TimerReset,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";

const WORK_SECONDS = 20 * 60;
const BREAK_SECONDS = 20;
const STORAGE_KEY = "flowmind-eye-care-v1";

type TimerPhase = "work" | "break";

type StoredEyeCareState = {
  phase: TimerPhase;
  remaining: number;
  running: boolean;
  completedToday: number;
  completedDate: string;
  notificationsEnabled: boolean;
  savedAt: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function defaultRemaining(phase: TimerPhase) {
  return phase === "work" ? WORK_SECONDS : BREAK_SECONDS;
}

function notify(title: string, body: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    return;
  }

  new Notification(title, {
    body,
    icon: "/brand/flowmind-icon-192.png",
  });
}

export function EyeCareShell() {
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [remaining, setRemaining] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        try {
          const stored = JSON.parse(storedValue) as StoredEyeCareState;
          const sameDay = stored.completedDate === todayKey();
          const elapsedSinceSave = stored.running
            ? Math.max(0, Math.floor((Date.now() - stored.savedAt) / 1000))
            : 0;

          setPhase(stored.phase);
          setRemaining(Math.max(0, stored.remaining - elapsedSinceSave));
          setRunning(stored.running);
          setCompletedToday(sameDay ? stored.completedToday : 0);
          setNotificationsEnabled(stored.notificationsEnabled);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const state: StoredEyeCareState = {
      phase,
      remaining,
      running,
      completedToday,
      completedDate: todayKey(),
      notificationsEnabled,
      savedAt: Date.now(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [completedToday, hydrated, notificationsEnabled, phase, remaining, running]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current > 1) return current - 1;

        if (phase === "work") {
          setPhase("break");
          if (notificationsEnabled) {
            notify(
              "Time for your 20-second eye break",
              "Look at something around 20 feet away and relax your eyes.",
            );
          }
          return BREAK_SECONDS;
        }

        setCompletedToday((count) => count + 1);
        setPhase("work");
        if (notificationsEnabled) {
          notify("Eye break complete", "Your next 20-minute screen interval has started.");
        }
        return WORK_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [notificationsEnabled, phase, running]);

  const totalSeconds = defaultRemaining(phase);
  const progress = useMemo(
    () => Math.min(100, Math.max(0, ((totalSeconds - remaining) / totalSeconds) * 100)),
    [remaining, totalSeconds],
  );

  const cycleLabel = completedToday === 1 ? "1 break" : `${completedToday} breaks`;

  function toggleRunning() {
    setRunning((current) => !current);
  }

  function resetCurrentPhase() {
    setRunning(false);
    setRemaining(defaultRemaining(phase));
  }

  function restartCycle() {
    setRunning(false);
    setPhase("work");
    setRemaining(WORK_SECONDS);
  }

  function resetTodayStats() {
    setCompletedToday(0);
  }

  function skipPhase() {
    if (phase === "work") {
      setPhase("break");
      setRemaining(BREAK_SECONDS);
      return;
    }
    setPhase("work");
    setRemaining(WORK_SECONDS);
  }

  async function toggleNotifications() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }

    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Healthy screen rhythm"
        insightText="Regular distance breaks can reduce digital eye-strain symptoms during long screen sessions."
        insightValue={cycleLabel}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="min-h-screen xl:pl-[272px]"
      >
        <WorkspaceTopbar
          eyebrow="Eye care workspace"
          title="Give your eyes room to recover."
          description="Use the 20-20-20 rhythm to create healthier screen-work habits."
          maxWidth="max-w-[1500px]"
          actions={
            <div className="hidden h-11 items-center rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 sm:flex">
              Today:
              <span className="ml-1.5 font-black text-slate-950 dark:text-white">
                {cycleLabel}
              </span>
            </div>
          }
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-6 sm:px-6 xl:px-8 xl:pb-10">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={Eye}
              label="Current phase"
              value={phase === "work" ? "Screen interval" : "Distance break"}
              detail={phase === "work" ? "20 minutes of mindful screen use" : "Look roughly 20 feet away"}
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed today"
              value={String(completedToday)}
              detail="Full 20-minute + 20-second cycles"
            />
            <StatCard
              icon={notificationsEnabled ? Bell : BellOff}
              label="Break alerts"
              value={notificationsEnabled ? "Enabled" : "Off"}
              detail="Browser notification at each transition"
            />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
              <div className="relative isolate overflow-hidden p-6 sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_36%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.10),transparent_38%)]" />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {running ? "Timer active" : "Timer paused"}
                      </p>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold">
                      {phase === "work" ? "Use your screen normally" : "Look into the distance"}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {phase === "work"
                        ? "FlowMind will remind you after 20 minutes. Blink naturally and keep a comfortable viewing distance."
                        : "For 20 seconds, focus on an object around 20 feet (about 6 metres) away and let your focusing muscles relax."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleNotifications()}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                  >
                    {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    {notificationsEnabled ? "Alerts enabled" : "Enable alerts"}
                  </button>
                </div>

                <div className="mx-auto mt-10 flex max-w-xl flex-col items-center text-center">
                  <div className="relative grid h-72 w-72 place-items-center rounded-full sm:h-80 sm:w-80">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(rgb(6 182 212) ${progress}%, rgba(148,163,184,0.16) ${progress}% 100%)`,
                      }}
                    />
                    <div className="absolute inset-[10px] rounded-full bg-white shadow-inner dark:bg-[#0a0e1a]" />
                    <div className="relative z-10">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
                        {phase === "work" ? <Eye className="h-7 w-7" /> : <EyeOff className="h-7 w-7" />}
                      </div>
                      <p className="mt-5 text-6xl font-bold tracking-[-0.06em] tabular-nums sm:text-7xl">
                        {formatTime(remaining)}
                      </p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        {phase === "work" ? "until eye break" : "keep looking away"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={toggleRunning}
                      className="flex min-w-40 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                    >
                      {running ? <CirclePause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                      {running ? "Pause timer" : "Start timer"}
                    </button>
                    <ActionButton icon={TimerReset} label="Reset phase" onClick={resetCurrentPhase} />
                    <ActionButton icon={RefreshCcw} label="Skip" onClick={skipPhase} />
                  </div>

                  <button
                    type="button"
                    onClick={restartCycle}
                    className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart the complete cycle
                  </button>

                  <button
                    type="button"
                    onClick={resetTodayStats}
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-500 transition hover:text-red-600 dark:hover:text-red-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {"Reset today's stats"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">The 20-20-20 technique</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Every 20 minutes, look at something about 20 feet away for at least 20 seconds.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ["20", "minutes"],
                    ["20", "feet away"],
                    ["20", "seconds"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-white/[0.04]">
                      <p className="text-xl font-bold">{value}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-violet-200/70 bg-gradient-to-br from-violet-50 to-cyan-50 p-5 dark:border-violet-400/15 dark:from-violet-500/10 dark:to-cyan-500/10">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm dark:bg-white/10 dark:text-violet-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Flow Assistant</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {completedToday >= 8
                        ? "Excellent screen-break consistency today. Continue working comfortably and stop if eye discomfort persists."
                        : completedToday > 0
                          ? `You completed ${completedToday} healthy eye ${completedToday === 1 ? "break" : "breaks"} today. Keep the rhythm gentle and consistent.`
                          : "Start the timer when your screen work begins. FlowMind will handle the transitions for you."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <h3 className="text-sm font-bold">Comfort checklist</h3>
                <div className="mt-4 space-y-3">
                  {[
                    "Blink naturally during screen work",
                    "Keep text readable without leaning forward",
                    "Reduce glare and match screen brightness",
                    "Use proper eye care if symptoms persist",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}

type IconType = typeof Eye;

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: IconType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: IconType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-32 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
