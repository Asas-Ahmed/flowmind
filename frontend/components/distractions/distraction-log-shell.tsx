"use client";

import { motion } from "framer-motion";
import {
  BellRing,
  Brain,
  Clock3,
  Flame,
  Lightbulb,
  MessageCircle,
  Music2,
  Phone,
  Plus,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createDistractionLog,
  deleteDistractionLog,
  getDistractionWorkspace,
} from "@/lib/api";
import type {
  DistractionContext,
  DistractionLog,
  DistractionType,
  DistractionWorkspace,
} from "@/types/distraction";

const distractionOptions: Array<{
  value: DistractionType;
  label: string;
  icon: typeof Phone;
}> = [
  { value: "phone", label: "Phone", icon: Phone },
  { value: "social_media", label: "Social media", icon: Smartphone },
  { value: "noise", label: "Noise", icon: Music2 },
  { value: "messages", label: "Messages", icon: MessageCircle },
  { value: "hunger", label: "Hunger", icon: Utensils },
  { value: "tiredness", label: "Tiredness", icon: Flame },
  { value: "thoughts", label: "Random thoughts", icon: Brain },
  { value: "other", label: "Other", icon: Zap },
];

const contexts: DistractionContext[] = ["focus", "study", "work", "task", "break", "other"];
const recoverySuggestions = [
  "Put phone out of reach",
  "Mute notifications",
  "Restart a 10-minute focus block",
  "Write the thought down and return",
  "Take a short water break",
];

function labelFor(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHour(hour: number | null) {
  if (hour === null) return "Not yet";
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:00 ${suffix}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-violet-600 dark:bg-white/[0.07] dark:text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Awareness</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function DistractionLogShell() {
  const [workspace, setWorkspace] = useState<DistractionWorkspace | null>(null);
  const [type, setType] = useState<DistractionType>("phone");
  const [context, setContext] = useState<DistractionContext>("focus");
  const [intensity, setIntensity] = useState(2);
  const [minutesLost, setMinutesLost] = useState(5);
  const [recoveryAction, setRecoveryAction] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getDistractionWorkspace());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load distraction data");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDistractionWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load distraction data");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedOption = useMemo(
    () => distractionOptions.find((option) => option.value === type) ?? distractionOptions[0],
    [type],
  );

  const SelectedIcon = selectedOption.icon;

  async function saveLog() {
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await createDistractionLog({
        distraction_type: type,
        context,
        intensity,
        minutes_lost: minutesLost,
        recovery_action: recoveryAction.trim() || null,
        note: note.trim() || null,
      });
      setNote("");
      setRecoveryAction("");
      setSaved(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save this distraction");
    } finally {
      setBusy(false);
    }
  }

  async function removeLog(log: DistractionLog) {
    if (!window.confirm(`Delete this ${labelFor(log.distraction_type)} distraction log?`)) return;
    setDeletingId(log.id);
    setError("");
    try {
      await deleteDistractionLog(log.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete this log");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Distraction awareness"
        insightText="Capture interruptions quickly, then test one small environmental change instead of relying on willpower alone."
        insightValue={workspace?.most_common_distraction ? labelFor(workspace.most_common_distraction) : "Start logging"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar
          eyebrow="Focus patterns"
          title="Distraction Log"
          description="Record what interrupted you, understand recurring triggers, and run small experiments to protect your attention."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh distraction log"
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
            <StatCard icon={BellRing} label="Logged this week" value={`${workspace?.logs_this_week ?? 0}`} detail={`${workspace?.total_logs ?? 0} interruptions recorded overall`} />
            <StatCard icon={Clock3} label="Time lost this week" value={`${workspace?.minutes_lost_this_week ?? 0} min`} detail="Your estimate across the last seven days" />
            <StatCard icon={Smartphone} label="Most common" value={workspace?.most_common_distraction ? labelFor(workspace.most_common_distraction) : "Not yet"} detail="The interruption appearing most often" />
            <StatCard icon={Flame} label="Peak interruption time" value={formatHour(workspace?.peak_hour ?? null)} detail="Based on the hour distractions were logged" />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.12fr_0.88fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Quick capture</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What interrupted you?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Log the interruption without judging it. Accurate patterns matter more than perfect focus.</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {distractionOptions.map((option) => {
                  const Icon = option.icon;
                  const active = type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setType(option.value);
                        setSaved(false);
                      }}
                      className={`rounded-2xl border p-3 text-left transition ${active ? "border-violet-400 bg-violet-50 ring-4 ring-violet-500/10 dark:border-cyan-400/40 dark:bg-cyan-400/[0.08]" : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.025]"}`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-violet-600 dark:text-cyan-300" : "text-slate-400"}`} />
                      <span className="mt-2 block text-xs font-black">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Context</span>
                  <select value={context} onChange={(event) => setContext(event.target.value as DistractionContext)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none dark:border-white/10 dark:bg-[#111522]">
                    {contexts.map((item) => <option key={item} value={item}>{labelFor(item)}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Intensity</span>
                  <select value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none dark:border-white/10 dark:bg-[#111522]">
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Minutes lost</span>
                  <input type="number" min={0} max={480} value={minutesLost} onChange={(event) => setMinutesLost(Math.max(0, Math.min(480, Number(event.target.value))))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Recovery action</span>
                  <input value={recoveryAction} onChange={(event) => setRecoveryAction(event.target.value)} maxLength={180} placeholder="What helped you return?" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Optional note</span>
                  <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="What happened just before it?" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {recoverySuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => setRecoveryAction(suggestion)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-cyan-300">{suggestion}</button>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.035]">
                  <SelectedIcon className="h-5 w-5 text-violet-600 dark:text-cyan-300" />
                  <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-black text-slate-800 dark:text-slate-200">{selectedOption.label}</span> during {labelFor(context).toLowerCase()}</p>
                </div>
                <button type="button" disabled={busy} onClick={() => void saveLog()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  <Plus className="h-4 w-4" />
                  {busy ? "Saving..." : "Log distraction"}
                </button>
              </div>
              {saved && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">Distraction recorded.</p>}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-6 text-white shadow-xl shadow-indigo-500/15">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Flow Assistant</p>
                  <h2 className="text-xl font-black">{workspace?.insight.title ?? "Reveal your focus pattern"}</h2>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-white/85">{workspace?.insight.message ?? "Log your first distraction to begin building an explainable pattern."}</p>
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Suggested experiment</p>
                    <p className="mt-2 text-sm font-semibold leading-6">{workspace?.insight.experiment ?? "Change one environmental factor during your next session."}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Distraction mix</p>
                {!workspace?.breakdown.length && <p className="text-sm text-white/70">No pattern yet.</p>}
                {workspace?.breakdown.slice(0, 5).map((item) => (
                  <div key={item.distraction_type}>
                    <div className="flex items-center justify-between text-xs font-bold"><span>{labelFor(item.distraction_type)}</span><span>{item.percentage}%</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15"><motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} className="h-full rounded-full bg-white" /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">History</p>
                <h2 className="mt-1 text-xl font-black">Recent interruptions</h2>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 space-y-3">
              {!workspace?.logs.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center dark:border-white/15">
                  <BellRing className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-bold">No distractions logged yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use the quick buttons above when an interruption happens.</p>
                </div>
              )}

              {workspace?.logs.map((log) => {
                const option = distractionOptions.find((item) => item.value === log.distraction_type) ?? distractionOptions[7];
                const Icon = option.icon;
                return (
                  <article key={log.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.025] sm:flex-row sm:items-center">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm dark:bg-white/[0.07] dark:text-cyan-300"><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black">{option.label}</p>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-cyan-400/10 dark:text-cyan-300">{labelFor(log.context)}</span>
                        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">Intensity {log.intensity}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(log.occurred_at).toLocaleString()} · {log.minutes_lost} minutes lost</p>
                      {log.recovery_action && <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Recovery: {log.recovery_action}</p>}
                      {log.note && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{log.note}</p>}
                    </div>
                    <button type="button" disabled={deletingId === log.id} onClick={() => void removeLog(log)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-400/10 dark:hover:text-rose-300" aria-label="Delete distraction log"><Trash2 className="h-4 w-4" /></button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
