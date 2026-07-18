"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createEnergyCheckIn,
  deleteEnergyCheckIn,
  getEnergyWorkspace,
} from "@/lib/api";
import type {
  CheckInLevel,
  EnergyCheckIn,
  EnergyWorkspace,
} from "@/types/energy";

const LEVELS: Array<{ value: CheckInLevel; label: string; detail: string }> = [
  { value: 1, label: "Low", detail: "Limited right now" },
  { value: 2, label: "Medium", detail: "Manageable and steady" },
  { value: 3, label: "High", detail: "Strong and available" },
];

const FOCUS_LEVELS: Array<{ value: CheckInLevel; label: string; detail: string }> = [
  { value: 1, label: "Poor", detail: "Easily distracted" },
  { value: 2, label: "Okay", detail: "Can make progress" },
  { value: 3, label: "Strong", detail: "Ready for deep work" },
];

function levelLabel(value: CheckInLevel, kind: "focus" | "standard" = "standard") {
  const source = kind === "focus" ? FOCUS_LEVELS : LEVELS;
  return source.find((item) => item.value === value)?.label ?? "Medium";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EnergyCheckInShell() {
  const [workspace, setWorkspace] = useState<EnergyWorkspace | null>(null);
  const [energy, setEnergy] = useState<CheckInLevel>(2);
  const [stress, setStress] = useState<CheckInLevel>(2);
  const [focus, setFocus] = useState<CheckInLevel>(2);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const data = await getEnergyWorkspace();
      setWorkspace(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the energy check-in workspace",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getEnergyWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the energy check-in workspace",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const preview = useMemo(() => {
    if (stress === 3) return "Recovery-first plan";
    if (energy === 1) return "Low-energy plan";
    if (focus === 3 && energy >= 2 && stress <= 2) return "Deep-work window";
    if (focus === 1) return "Focus reset";
    return "Balanced work block";
  }, [energy, focus, stress]);

  async function saveCheckIn() {
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await createEnergyCheckIn({
        energy_level: energy,
        stress_level: stress,
        focus_level: focus,
        note: note.trim() || null,
      });
      setNote("");
      setSaved(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save your check-in",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeCheckIn(item: EnergyCheckIn) {
    const confirmed = window.confirm(
      `Delete the check-in from ${formatDate(item.checked_at)}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    try {
      await deleteEnergyCheckIn(item.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this check-in",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Current state"
        insightText="Check in honestly so FlowMind can suggest a work approach that matches your available capacity."
        insightValue={workspace?.latest_checkin ? "Updated" : "Ready"}
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-0 xl:pl-[280px]"
      >
        <WorkspaceTopbar
          eyebrow="Adaptive wellbeing"
          title="Energy & Mental Fatigue Check-In"
          description="Record your current energy, stress, and focus to receive an explainable next-step suggestion."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh energy data"
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
            <StatCard icon={BatteryCharging} label="Average energy" value={workspace?.average_energy ? `${workspace.average_energy}/3` : "No data"} detail={`${workspace?.weekly_checkins ?? 0} check-ins this week`} />
            <StatCard icon={Activity} label="Average stress" value={workspace?.average_stress ? `${workspace.average_stress}/3` : "No data"} detail="Lower is more comfortable" />
            <StatCard icon={Brain} label="Average focus" value={workspace?.average_focus ? `${workspace.average_focus}/3` : "No data"} detail="Based on your last 7 days" />
            <StatCard icon={Gauge} label="Strongest state" value={workspace?.strongest_state ?? "No pattern yet"} detail={`${workspace?.today_checkins ?? 0} check-ins today`} />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Quick check-in</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">How do you feel right now?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">This is a productivity self-check, not a medical assessment.</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/20">
                  <Zap className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <LevelPicker title="Energy" description="How much usable energy do you have?" value={energy} onChange={setEnergy} options={LEVELS} />
                <LevelPicker title="Stress" description="How pressured or tense do you feel?" value={stress} onChange={setStress} options={LEVELS} reverseTone />
                <LevelPicker title="Focus" description="How well can you concentrate?" value={focus} onChange={setFocus} options={FOCUS_LEVELS} />
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Optional note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="What is affecting your current state?"
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:focus:border-cyan-400/50"
                />
              </label>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/[0.08] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Likely recommendation</p>
                  <p className="mt-1 font-bold">{preview}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveCheckIn()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  {saved ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  {busy ? "Saving..." : saved ? "Saved" : "Save check-in"}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 p-5 shadow-sm dark:border-blue-400/20 dark:from-blue-500/10 dark:via-cyan-400/[0.06] dark:to-violet-500/[0.08] sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-cyan-300">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Flow Assistant</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{workspace?.recommendation.title ?? "Use a balanced work block"}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace?.recommendation.message ?? "Complete a check-in to receive a suggestion matched to your current capacity."}</p>
                    <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 p-4 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100">
                      {workspace?.recommendation.action ?? "Choose one important task and complete a focused 25-minute block."}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Seven-day pattern</p>
                    <h2 className="mt-1 text-xl font-black">State trend</h2>
                  </div>
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div className="mt-6 grid grid-cols-7 gap-2">
                  {(workspace?.trend_points ?? []).map((point) => (
                    <div key={point.date} className="text-center">
                      <div className="flex h-28 items-end justify-center gap-1 rounded-xl bg-slate-50 px-1.5 pb-2 dark:bg-white/[0.035]">
                        <span title={`Energy ${point.energy}`} className="w-2 rounded-full bg-blue-500" style={{ height: `${Math.max(4, (point.energy / 3) * 88)}%`, opacity: point.checkins ? 1 : 0.15 }} />
                        <span title={`Focus ${point.focus}`} className="w-2 rounded-full bg-violet-500" style={{ height: `${Math.max(4, (point.focus / 3) * 88)}%`, opacity: point.checkins ? 1 : 0.15 }} />
                        <span title={`Stress ${point.stress}`} className="w-2 rounded-full bg-rose-400" style={{ height: `${Math.max(4, (point.stress / 3) * 88)}%`, opacity: point.checkins ? 1 : 0.15 }} />
                      </div>
                      <p className="mt-2 text-[10px] font-bold uppercase text-slate-400">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${point.date}T00:00:00`))}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Legend dot="bg-blue-500" label="Energy" />
                  <Legend dot="bg-violet-500" label="Focus" />
                  <Legend dot="bg-rose-400" label="Stress" />
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Recent history</p>
              <h2 className="mt-1 text-xl font-black">Saved check-ins</h2>
            </div>

            <div className="mt-5 space-y-3">
              {(workspace?.recent_checkins ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">No check-ins yet. Save your current state to begin detecting patterns.</div>
              ) : (
                workspace?.recent_checkins.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                        <span>Energy: {levelLabel(item.energy_level)}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>Stress: {levelLabel(item.stress_level)}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>Focus: {levelLabel(item.focus_level, "focus")}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.checked_at)}{item.note ? ` · ${item.note}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => void removeCheckIn(item)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-rose-400/20 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
                      aria-label="Delete check-in"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

function LevelPicker({
  title,
  description,
  value,
  onChange,
  options,
  reverseTone = false,
}: {
  title: string;
  description: string;
  value: CheckInLevel;
  onChange: (value: CheckInLevel) => void;
  options: Array<{ value: CheckInLevel; label: string; detail: string }>;
  reverseTone?: boolean;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <span className="text-xs font-bold text-indigo-600 dark:text-cyan-300">{options.find((item) => item.value === value)?.label}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                active
                  ? reverseTone && option.value === 3
                    ? "border-rose-300 bg-rose-50 shadow-sm dark:border-rose-400/30 dark:bg-rose-400/10"
                    : "border-indigo-300 bg-indigo-50 shadow-sm dark:border-cyan-400/30 dark:bg-cyan-400/10"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-white/15"
              }`}
            >
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="mt-1 hidden text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:block">{option.detail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof BatteryCharging; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <Icon className="h-5 w-5 text-indigo-500 dark:text-cyan-300" />
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
