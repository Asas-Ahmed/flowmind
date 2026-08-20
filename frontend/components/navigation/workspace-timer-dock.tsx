"use client";

import { Eye, Focus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getFocusWorkspace } from "@/lib/api";
import type { FocusSession } from "@/types/focus";

const EYE_STORAGE_KEY = "flowmind-eye-care-v1";
const DISMISSED_KEY = "flowmind-workspace-timer-dock-dismissed";

type EyeTimerState = {
  phase: "work" | "break";
  remaining: number;
  running: boolean;
  savedAt: number;
};

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function focusElapsed(session: FocusSession, now: number) {
  if (session.status !== "active") return session.elapsed_seconds;
  const anchor = new Date(session.updated_at || session.started_at).getTime();
  if (!Number.isFinite(anchor)) return session.elapsed_seconds;
  return session.elapsed_seconds + Math.max(0, Math.floor((now - anchor) / 1000));
}

function readEyeTimer(now: number): EyeTimerState | null {
  try {
    const raw = window.localStorage.getItem(EYE_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as EyeTimerState;
    if (!stored.running) return null;
    return {
      ...stored,
      remaining: Math.max(0, stored.remaining - Math.floor((now - stored.savedAt) / 1000)),
    };
  } catch {
    return null;
  }
}

export function WorkspaceTimerDock() {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [eyeTimer, setEyeTimer] = useState<EyeTimerState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const restoreDismissed = window.requestAnimationFrame(() => {
      setDismissed(window.sessionStorage.getItem(DISMISSED_KEY) === "1");
    });

    const refresh = () => {
      const current = Date.now();
      setNow(current);
      setEyeTimer(readEyeTimer(current));
    };

    refresh();
    const tick = window.setInterval(refresh, 1000);
    return () => {
      window.cancelAnimationFrame(restoreDismissed);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshFocus = async () => {
      try {
        const data = await getFocusWorkspace();
        if (!cancelled) setFocusSession(data.active_session);
      } catch {
        if (!cancelled) setFocusSession(null);
      }
    };

    void refreshFocus();
    const poll = window.setInterval(() => void refreshFocus(), 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshFocus();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const focusRemaining = useMemo(() => {
    if (!focusSession || focusSession.status !== "active") return null;
    return Math.max(0, focusSession.planned_minutes * 60 - focusElapsed(focusSession, now));
  }, [focusSession, now]);

  const visible = !dismissed && (focusRemaining !== null || eyeTimer);
  if (!visible) return null;

  return (
    <div className="fixed bottom-[92px] right-3 z-[65] w-[min(330px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f19]/95 dark:shadow-black/40 xl:bottom-5 xl:right-5">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-3 py-2 dark:border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Running timers</p>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.setItem(DISMISSED_KEY, "1");
            setDismissed(true);
          }}
          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white"
          aria-label="Hide running timer popup"
          title="Hide timer popup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2">
        {focusRemaining !== null && focusSession && (
          <button
            type="button"
            onClick={() => router.push("/focus")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Focus className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black text-slate-900 dark:text-white">{focusSession.title}</span>
              <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">Focus session - tap to return</span>
            </span>
            <span className="font-mono text-sm font-black tabular-nums text-slate-900 dark:text-white">{formatClock(focusRemaining)}</span>
          </button>
        )}

        {eyeTimer && (
          <button
            type="button"
            onClick={() => router.push("/eye-care")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
              <Eye className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black text-slate-900 dark:text-white">Eye Care</span>
              <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{eyeTimer.phase === "work" ? "Screen interval" : "Distance break"}</span>
            </span>
            <span className="font-mono text-sm font-black tabular-nums text-slate-900 dark:text-white">{formatClock(eyeTimer.remaining)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
