"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlarmClock,
  BarChart3,
  CalendarDays,
  Clock3,
  MoonStar,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createSleepRecord,
  deleteSleepRecord,
  getSleepWorkspace,
} from "@/lib/api";
import type {
  SleepQuality,
  SleepRecord,
  SleepWorkspace,
} from "@/types/sleep";

function localDateValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function qualityLabel(value: number) {
  return ["", "Very poor", "Poor", "Okay", "Good", "Excellent"][value] ?? "Unknown";
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof MoonStar;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-indigo-600 dark:bg-white/[0.07] dark:text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Last 7 days
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function SleepRegularityShell() {
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return localDateValue(date);
  }, []);

  const [workspace, setWorkspace] = useState<SleepWorkspace | null>(null);
  const [sleepDate, setSleepDate] = useState(yesterday);
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState<SleepQuality>(3);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getSleepWorkspace());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the sleep workspace",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSleepWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the sleep workspace",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewDuration = useMemo(() => {
    const [bedHour, bedMinute] = bedtime.split(":").map(Number);
    const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);
    let minutes = wakeHour * 60 + wakeMinute - (bedHour * 60 + bedMinute);
    if (minutes <= 0) minutes += 1440;
    return Math.round((minutes / 60) * 10) / 10;
  }, [bedtime, wakeTime]);

  async function saveRecord() {
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await createSleepRecord({
        sleep_date: sleepDate,
        bedtime,
        wake_time: wakeTime,
        quality,
        note: note.trim() || null,
      });
      setNote("");
      setSaved(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save your sleep record",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeRecord(record: SleepRecord) {
    const confirmed = window.confirm(
      `Delete the sleep record for ${formatDate(record.sleep_date)}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(record.id);
    setError("");
    try {
      await deleteSleepRecord(record.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this sleep record",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Sleep regularity"
        insightText="Track timing consistency rather than chasing a perfect number. FlowMind uses these records only for productivity insights."
        insightValue={workspace?.weekly_records ? `${workspace.consistency_score}%` : "Ready"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar
          eyebrow="Wellbeing patterns"
          title="Sleep Regularity Tracker"
          description="Record bedtime, wake time, duration, and perceived quality to understand the consistency of your weekly routine."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh sleep data"
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
            <StatCard icon={Clock3} label="Average duration" value={workspace?.weekly_records ? `${workspace.average_duration} hrs` : "No data"} detail={`${workspace?.weekly_records ?? 0} nights recorded this week`} />
            <StatCard icon={Star} label="Average quality" value={workspace?.weekly_records ? `${workspace.average_quality}/5` : "No data"} detail={workspace?.weekly_records ? qualityLabel(Math.round(workspace.average_quality)) : "Add your first record"} />
            <StatCard icon={MoonStar} label="Bedtime variation" value={workspace?.weekly_records ? `${workspace.bedtime_variation_minutes} min` : "No data"} detail="Lower variation means a steadier routine" />
            <StatCard icon={BarChart3} label="Consistency score" value={workspace?.weekly_records ? `${workspace.consistency_score}%` : "No data"} detail={`Wake-time variation: ${workspace?.wake_variation_minutes ?? 0} min`} />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Nightly record</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">How was your sleep window?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">This tracker supports routine awareness and does not provide medical advice or diagnosis.</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                  <MoonStar className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Sleep date</span>
                  <input type="date" max={localDateValue(new Date())} value={sleepDate} onChange={(event) => setSleepDate(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Bedtime</span>
                  <input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Wake time</span>
                  <input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Perceived sleep quality</p>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {([1, 2, 3, 4, 5] as SleepQuality[]).map((value) => (
                    <button key={value} type="button" onClick={() => setQuality(value)} className={`rounded-2xl border px-2 py-3 text-center transition ${quality === value ? "border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"}`}>
                      <span className="block text-lg font-black">{value}</span>
                      <span className="mt-1 hidden text-[10px] font-semibold sm:block">{qualityLabel(value)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Optional note</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 500))} rows={3} placeholder="Anything that affected your sleep or morning routine?" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
              </label>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/[0.08] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Calculated sleep window</p>
                  <p className="mt-1 font-bold">{previewDuration} hours · {qualityLabel(quality)}</p>
                </div>
                <button type="button" disabled={busy || previewDuration < 2 || previewDuration > 16} onClick={() => void saveRecord()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  <MoonStar className="h-4 w-4" />
                  {busy ? "Saving..." : saved ? "Saved" : "Save sleep record"}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 p-5 shadow-sm dark:border-indigo-400/20 dark:from-indigo-500/10 dark:via-blue-400/[0.06] dark:to-violet-500/[0.08] sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-cyan-300">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Flow Assistant insight</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{workspace?.insight.title ?? "Build your sleep baseline"}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace?.insight.message ?? "Add sleep records to identify regularity patterns."}</p>
                    <div className="mt-4 rounded-2xl border border-white/70 bg-white/70 p-4 text-sm font-semibold leading-6 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
                      {workspace?.insight.action ?? "Record last night's sleep window."}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Weekly pattern</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight">Sleep duration trend</h2>
                  </div>
                  <AlarmClock className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="mt-6 grid grid-cols-7 items-end gap-2">
                  {(workspace?.trend_points ?? []).map((point) => {
                    const height = point.has_record ? Math.max(18, Math.min(100, point.duration_hours * 10)) : 8;
                    return (
                      <div key={point.date} className="text-center">
                        <div className="flex h-32 items-end justify-center rounded-2xl bg-slate-50 px-1 dark:bg-white/[0.035]">
                          <div title={point.has_record ? `${point.duration_hours} hours` : "No record"} style={{ height: `${height}%` }} className={`w-full rounded-xl ${point.has_record ? "bg-gradient-to-t from-indigo-600 via-blue-500 to-cyan-400" : "bg-slate-200 dark:bg-white/10"}`} />
                        </div>
                        <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${point.date}T12:00:00`))}</p>
                      </div>
                    );
                  })}
                  {!workspace?.trend_points.length && <p className="col-span-7 py-10 text-center text-sm text-slate-500">Loading weekly pattern...</p>}
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">History</p>
                <h2 className="mt-1 text-xl font-black tracking-tight">Recent sleep records</h2>
              </div>
              <CalendarDays className="h-5 w-5 text-indigo-500" />
            </div>

            <div className="mt-5 space-y-3">
              {(workspace?.recent_records ?? []).map((record) => (
                <div key={record.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-400/10 dark:text-cyan-300">
                      <MoonStar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold">{formatDate(record.sleep_date)}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatTime(record.bedtime)} – {formatTime(record.wake_time)} · {record.duration_hours} hrs</p>
                      {record.note && <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">{record.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:bg-white/[0.07] dark:text-slate-200">Quality {record.quality}/5</span>
                    <button type="button" disabled={deletingId === record.id} onClick={() => void removeRecord(record)} className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300" aria-label={`Delete sleep record for ${record.sleep_date}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {workspace && workspace.recent_records.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-white/15">
                  <MoonStar className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 font-bold">No sleep records yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add last night&apos;s sleep to begin building your regularity baseline.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
