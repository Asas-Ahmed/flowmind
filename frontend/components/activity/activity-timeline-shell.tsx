"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CupSoda,
  Flame,
  Focus,
  HeartPulse,
  ListFilter,
  PersonStanding,
  RefreshCw,
  Search,
  Smartphone,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { getActivityTimeline } from "@/lib/api";
import type { ActivityItem, ActivityKind, ActivityTimeline } from "@/types/activity";

const card =
  "rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20";

type KindMeta = {
  label: string;
  icon: LucideIcon;
  iconClass: string;
};

const kindMeta: Record<ActivityKind, KindMeta> = {
  task: { label: "Tasks", icon: CheckCircle2, iconClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
  habit: { label: "Habits", icon: Flame, iconClass: "bg-orange-500/12 text-orange-600 dark:text-orange-300" },
  focus: { label: "Focus", icon: Focus, iconClass: "bg-violet-500/12 text-violet-600 dark:text-violet-300" },
  time_tracking: { label: "Time tracking", icon: Clock3, iconClass: "bg-blue-500/12 text-blue-600 dark:text-blue-300" },
  schedule: { label: "Schedule", icon: CalendarDays, iconClass: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-300" },
  energy: { label: "Energy", icon: BatteryCharging, iconClass: "bg-amber-500/12 text-amber-600 dark:text-amber-300" },
  movement: { label: "Movement", icon: PersonStanding, iconClass: "bg-lime-500/12 text-lime-700 dark:text-lime-300" },
  nourishment: { label: "Nourishment", icon: CupSoda, iconClass: "bg-sky-500/12 text-sky-600 dark:text-sky-300" },
  recovery: { label: "Recovery", icon: HeartPulse, iconClass: "bg-rose-500/12 text-rose-600 dark:text-rose-300" },
  distraction: { label: "Distractions", icon: Smartphone, iconClass: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
};

const rangeOptions = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function dateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = dateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dateKey(value) === today) return "Today";
  if (dateKey(value) === dateKey(yesterday.toISOString())) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function ActivityTimelineShell() {
  const [timeline, setTimeline] = useState<ActivityTimeline | null>(null);
  const [range, setRange] = useState(30);
  const [selectedKind, setSelectedKind] = useState<ActivityKind | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTimeline(await getActivityTimeline(range));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load your activity timeline.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTimeline();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadTimeline]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (timeline?.items ?? []).filter((item) => {
      const matchesKind = selectedKind === "all" || item.kind === selectedKind;
      const matchesSearch = !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      return matchesKind && matchesSearch;
    });
  }, [search, selectedKind, timeline]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ActivityItem[]>();
    filteredItems.forEach((item) => {
      const key = dateKey(item.occurred_at);
      const existing = groups.get(key) ?? [];
      existing.push(item);
      groups.set(key, existing);
    });
    return Array.from(groups.entries());
  }, [filteredItems]);

  const summaryCards = timeline
    ? [
        { label: "Timeline events", value: timeline.summary.total_events, helper: `Across ${timeline.summary.active_days} active days`, icon: Activity },
        { label: "Tasks completed", value: timeline.summary.tasks_completed, helper: `Within the selected ${range} days`, icon: CheckCircle2 },
        { label: "Focused time", value: formatMinutes(timeline.summary.focus_minutes), helper: "Completed focus sessions", icon: Focus },
        { label: "Tracked time", value: formatMinutes(timeline.summary.tracked_minutes), helper: "Finished time entries", icon: Clock3 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Your work, connected"
        insightText="The activity timeline brings actions from your FlowMind tools into one chronological view."
        insightValue={`${timeline?.summary.total_events ?? 0} events`}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-0">
        <WorkspaceTopbar
          eyebrow="Reflection workspace"
          title="Activity Timeline"
          description="Review completed work, wellbeing check-ins, tracked time, and planning changes in one place."
          actions={
            <button
              type="button"
              onClick={() => void loadTimeline()}
              disabled={loading}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh timeline"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          }
        />

        <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {summaryCards.map(({ label, value, helper, icon: Icon }) => (
              <div key={label} className={`${card} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section className={`${card} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {rangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      range === option.value
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.09]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative min-w-0 sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your activity"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.045]"
                  />
                </label>

                <label className="relative">
                  <ListFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedKind}
                    onChange={(event) => setSelectedKind(event.target.value as ActivityKind | "all")}
                    className="h-11 min-w-48 appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-[#111421]"
                  >
                    <option value="all">All activity</option>
                    {(timeline?.available_kinds ?? []).map((kind) => (
                      <option key={kind} value={kind}>{kindMeta[kind].label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          {error && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </section>
          )}

          <section className={`${card} overflow-hidden p-4 sm:p-6`}>
            {loading && !timeline ? (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <RefreshCw className="mx-auto h-7 w-7 animate-spin text-indigo-500" />
                  <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Connecting your FlowMind activity…</p>
                </div>
              </div>
            ) : groupedItems.length ? (
              <div className="space-y-8">
                {groupedItems.map(([key, items]) => (
                  <div key={key}>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{dayLabel(items[0].occurred_at)}</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                        {items.length} event{items.length === 1 ? "" : "s"}
                      </span>
                      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                    </div>

                    <div className="relative space-y-1 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-slate-200 dark:before:bg-white/10 sm:before:left-[90px]">
                      {items.map((item) => {
                        const meta = kindMeta[item.kind];
                        const Icon = meta.icon;
                        return (
                          <article key={item.id} className="relative grid gap-3 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/[0.025] sm:grid-cols-[72px_44px_minmax(0,1fr)] sm:items-start">
                            <time className="hidden pt-3 text-right text-xs font-bold tabular-nums text-slate-400 sm:block">{formatTime(item.occurred_at)}</time>
                            <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-2xl ring-4 ring-white dark:ring-[#10131f] ${meta.iconClass}`}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-slate-950 dark:text-white">{item.title}</h3>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">{meta.label}</span>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-400 sm:pt-0.5">
                                  <span className="sm:hidden">{formatTime(item.occurred_at)}</span>
                                  {item.duration_minutes !== null && item.duration_minutes > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 dark:bg-white/[0.06]">
                                      <TimerReset className="h-3.5 w-3.5" />
                                      {formatMinutes(item.duration_minutes)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                    <Activity className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 text-xl font-black">No matching activity</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Complete tasks, track sessions, log check-ins, or adjust the filters to build your unified productivity story.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
