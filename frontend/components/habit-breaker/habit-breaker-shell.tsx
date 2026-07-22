"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Award,
  CalendarDays,
  Check,
  Clock3,
  Coins,
  Edit3,
  Gift,
  History,
  LoaderCircle,
  MoreHorizontal,
  PauseCircle,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Undo2,
  X,
} from "lucide-react";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  addQuitReward,
  createQuitJourney,
  deleteQuitJourney,
  deleteQuitReward,
  getHabitBreakerWorkspace,
  resetQuitJourney,
  toggleQuitReward,
  updateQuitJourney,
  updateQuitReward,
} from "@/lib/api";
import type {
  HabitBreakerWorkspace,
  JourneyPayload,
  QuitJourney,
  QuitReward,
} from "@/types/habit-breaker";

const toLocalInput = (value: string | Date) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const initialForm = (): JourneyPayload => ({
  name: "",
  category: "digital",
  icon: "shield",
  color: "#7c3aed",
  quit_at: toLocalInput(new Date()),
  birth_at: null,
  why: [],
  triggers: [],
  strategy: "",
  cost_per_occurrence: 0,
  minutes_per_occurrence: 0,
  occurrences_per_week: 0,
});

function clock(seconds: number) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

function splitList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function HabitBreakerShell() {
  const [workspace, setWorkspace] = useState<HabitBreakerWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [journeyModal, setJourneyModal] = useState(false);
  const [editing, setEditing] = useState<QuitJourney | null>(null);
  const [selected, setSelected] = useState<QuitJourney | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [form, setForm] = useState<JourneyPayload>(initialForm);
  const [whyText, setWhyText] = useState("");
  const [triggerText, setTriggerText] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetJourneyId, setResetJourneyId] = useState<number | null>(null);
  const [resetAt, setResetAt] = useState(toLocalInput(new Date()));
  const [resetTrigger, setResetTrigger] = useState("");
  const [resetNote, setResetNote] = useState("");
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardJourneyId, setRewardJourneyId] = useState<number | null>(null);
  const [editingReward, setEditingReward] = useState<QuitReward | null>(null);
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDays, setRewardDays] = useState(7);
  const [rewardCost, setRewardCost] = useState(0);
  const [rewardFilter, setRewardFilter] = useState<number | "all">("all");

  const reload = async () => {
    try {
      setError("");
      setWorkspace(await getHabitBreakerWorkspace());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load habit breaker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const journeys = useMemo(
    () => workspace?.journeys.filter((journey) => showArchived || journey.is_active) ?? [],
    [showArchived, workspace],
  );

  const calendarDays = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (let offset = 34; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      result.push(day);
    }
    return result;
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm());
    setWhyText("");
    setTriggerText("");
    setJourneyModal(true);
  };

  const openEdit = (journey: QuitJourney) => {
    setEditing(journey);
    setForm({
      name: journey.name,
      category: journey.category,
      icon: journey.icon,
      color: journey.color,
      quit_at: toLocalInput(journey.quit_at),
      birth_at: journey.birth_at ? toLocalInput(journey.birth_at) : null,
      why: journey.why,
      triggers: journey.triggers,
      strategy: journey.strategy ?? "",
      cost_per_occurrence: 0,
      minutes_per_occurrence: 0,
      occurrences_per_week: 0,
    });
    setWhyText(journey.why.join("\n"));
    setTriggerText(journey.triggers.join("\n"));
    setMenuId(null);
    setJourneyModal(true);
  };

  const submitJourney = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload: JourneyPayload = {
        ...form,
        name: form.name.trim(),
        quit_at: new Date(form.quit_at).toISOString(),
        birth_at: form.birth_at ? new Date(form.birth_at).toISOString() : null,
        why: splitList(whyText),
        triggers: splitList(triggerText),
      };
      if (editing) await updateQuitJourney(editing.id, payload);
      else await createQuitJourney(payload);
      setJourneyModal(false);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this journey.");
    } finally {
      setSaving(false);
    }
  };

  const removeJourney = async (journey: QuitJourney) => {
    const confirmed = window.confirm(
      `Delete “${journey.name}” and all its reset and reward history? This cannot be undone.`,
    );
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteQuitJourney(journey.id);
      if (selected?.id === journey.id) setSelected(null);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete this journey.");
    } finally {
      setSaving(false);
      setMenuId(null);
    }
  };

  const toggleArchived = async (journey: QuitJourney) => {
    setSaving(true);
    try {
      await updateQuitJourney(journey.id, { is_active: !journey.is_active });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update this journey.");
    } finally {
      setSaving(false);
      setMenuId(null);
    }
  };

  const openReset = (journey?: QuitJourney, day?: Date) => {
    const target = journey ?? workspace?.journeys.find((item) => item.is_active) ?? null;
    setResetJourneyId(target?.id ?? null);
    const date = day ? new Date(day) : new Date();
    if (day) date.setHours(12, 0, 0, 0);
    setResetAt(toLocalInput(date));
    setResetTrigger("");
    setResetNote("");
    setMenuId(null);
    setResetOpen(true);
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resetJourneyId) return;
    setSaving(true);
    setError("");
    try {
      await resetQuitJourney(resetJourneyId, {
        reset_at: new Date(resetAt).toISOString(),
        trigger: resetTrigger.trim() || undefined,
        note: resetNote.trim() || undefined,
      });
      setResetOpen(false);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to record this reset.");
    } finally {
      setSaving(false);
    }
  };

  const openRewardCreate = (journey?: QuitJourney) => {
    const target = journey ?? workspace?.journeys.find((item) => item.is_active) ?? null;
    setRewardJourneyId(target?.id ?? null);
    setEditingReward(null);
    setRewardTitle("");
    setRewardDays(7);
    setRewardCost(0);
    setRewardOpen(true);
  };

  const openRewardEdit = (journeyId: number, reward: QuitReward) => {
    setRewardJourneyId(journeyId);
    setEditingReward(reward);
    setRewardTitle(reward.title);
    setRewardDays(reward.target_days);
    setRewardCost(reward.estimated_cost);
    setRewardOpen(true);
  };

  const submitReward = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rewardJourneyId || !rewardTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: rewardTitle.trim(),
        target_days: Math.max(1, rewardDays),
        estimated_cost: Math.max(0, rewardCost),
      };
      if (editingReward) await updateQuitReward(editingReward.id, payload);
      else await addQuitReward(rewardJourneyId, payload);
      setRewardOpen(false);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this reward.");
    } finally {
      setSaving(false);
    }
  };

  const removeReward = async (reward: QuitReward) => {
    if (!window.confirm(`Delete reward “${reward.title}”?`)) return;
    setSaving(true);
    try {
      await deleteQuitReward(reward.id);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete this reward.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Progress is evidence"
        insightText="Track the clock, remember your reasons, learn from resets, and celebrate every meaningful milestone."
        insightValue={`${workspace?.summary.best_days ?? 0} best days`}
      />
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar
          eyebrow="Behaviour change"
          title="Habit Breaker"
          description="Break unwanted habits with live abstinence clocks, reasons, rewards, achievements, resets, and honest progress analytics."
        />
        <div className="mx-auto max-w-[1450px] space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid min-h-[420px] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {(
                  [
                    ["Active", workspace?.summary.active, ShieldCheck],
                    ["Best streak", `${workspace?.summary.best_days}d`, Trophy],
                    ["Money saved", `$${workspace?.summary.money_saved}`, Coins],
                    [
                      "Time saved",
                      `${Math.round((workspace?.summary.time_saved_minutes ?? 0) / 60)}h`,
                      Clock3,
                    ],
                    ["Resets", workspace?.summary.total_resets, History],
                    ["Rewards", workspace?.summary.rewards_bought, Gift],
                  ] as Array<[string, string | number | undefined, LucideIcon]>
                ).map(([label, value, SummaryIcon]) => (
                  <div
                    key={label}
                    className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"
                  >
                    <SummaryIcon className="h-5 w-5 text-violet-500" />
                    <p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black">{String(value)}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-[28px] border border-violet-200 bg-gradient-to-br from-violet-50 to-cyan-50 p-6 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-cyan-500/5">
                <div className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white dark:bg-white/10"><Sparkles className="h-5 w-5 text-violet-500" /></span>
                  <div><p className="text-xs font-black uppercase tracking-[.15em] text-violet-600 dark:text-cyan-300">Remember the why</p><p className="mt-2 font-bold leading-7">{workspace?.motivation}</p></div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div><p className="text-xs font-black uppercase tracking-[.15em] text-violet-600 dark:text-cyan-300">Your journeys</p><h2 className="mt-1 text-2xl font-black">Live progress clocks</h2></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowArchived((value) => !value)} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-black dark:border-white/10">
                      {showArchived ? "Hide archived" : "Show archived"}
                    </button>
                    <button onClick={openCreate} className="flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" />New journey</button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {journeys.length ? journeys.map((journey) => {
                    const progress = journey.next_milestone
                      ? Math.min(100, Math.max(0, ((journey.next_milestone.days - journey.next_milestone.remaining_days) / journey.next_milestone.days) * 100))
                      : 100;
                    return (
                      <article key={journey.id} className={`overflow-hidden rounded-[26px] border border-slate-200 dark:border-white/10 ${journey.is_active ? "" : "opacity-70"}`}>
                        <div className="p-5" style={{ background: `linear-gradient(135deg,${journey.color}18,transparent)` }}>
                          <div className="flex items-start justify-between gap-4">
                            <div><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">{journey.category}{!journey.is_active && " • archived"}</p><h3 className="mt-1 text-xl font-black">{journey.name}</h3></div>
                            <div className="relative">
                              <button onClick={() => setMenuId(menuId === journey.id ? null : journey.id)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5" aria-label={`Manage ${journey.name}`}><MoreHorizontal className="h-5 w-5" /></button>
                              {menuId === journey.id && (
                                <div className="absolute right-0 top-12 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                                  <button onClick={() => openEdit(journey)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5"><Edit3 className="h-4 w-4" />Edit journey</button>
                                  <button onClick={() => void toggleArchived(journey)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5">{journey.is_active ? <PauseCircle className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}{journey.is_active ? "Archive journey" : "Resume journey"}</button>
                                  <button onClick={() => void removeJourney(journey)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Delete permanently</button>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="mt-6 font-mono text-2xl font-black tabular-nums sm:text-3xl">{clock(journey.current_seconds + (journey.is_active ? now : 0))}</p>
                          <p className="mt-2 text-sm text-slate-500">since {new Date(journey.quit_at).toLocaleString()}</p>

                          <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[.12em]"><span>Next milestone</span><span>{journey.next_milestone ? `${journey.next_milestone.title} • ${Math.ceil(journey.next_milestone.remaining_days)}d left` : "All milestones complete"}</span></div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${progress}%` }} /></div>
                          </div>

                          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5"><b>{journey.longest_days}d</b><p className="text-[10px] uppercase text-slate-400">Maximum</p></div>
                            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5"><b>{journey.average_days}d</b><p className="text-[10px] uppercase text-slate-400">Average</p></div>
                            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5"><b>{journey.previous_days}d</b><p className="text-[10px] uppercase text-slate-400">Previous</p></div>
                            <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5"><b>{journey.reset_count}</b><p className="text-[10px] uppercase text-slate-400">Resets</p></div>
                          </div>

                          {journey.why.length > 0 && <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"><p className="text-xs font-black uppercase tracking-[.12em] text-violet-500">Why I quit</p><p className="mt-2 text-sm font-semibold">{journey.why.join(" • ")}</p></div>}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <button onClick={() => setSelected(journey)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-white/10">View analysis</button>
                            <button onClick={() => openRewardCreate(journey)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-white/10"><Gift className="mr-1 inline h-4 w-4" />Add reward</button>
                            {journey.is_active && <button onClick={() => openReset(journey)} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 dark:border-rose-500/30 dark:text-rose-300"><RotateCcw className="mr-1 inline h-4 w-4" />Record reset</button>}
                          </div>
                        </div>
                      </article>
                    );
                  }) : (
                    <div className="col-span-full py-16 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-3 font-black">Start your first change journey</p></div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.035]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3"><Gift className="h-5 w-5 text-violet-500" /><div><h2 className="text-xl font-black">Rewards Vault</h2><p className="text-sm text-slate-500">Plan meaningful rewards, track unlocks, and claim what you have earned.</p></div></div>
                  <div className="flex flex-wrap gap-2">
                    <select value={rewardFilter} onChange={(event) => setRewardFilter(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950">
                      <option value="all">All journeys</option>
                      {workspace?.journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.name}</option>)}
                    </select>
                    <button onClick={() => openRewardCreate()} className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white"><Plus className="h-4 w-4" />Add reward</button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><p className="text-xs font-black uppercase text-slate-400">Planned</p><p className="mt-2 text-2xl font-black">{workspace?.summary.total_rewards ?? 0}</p></div>
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10"><p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">Unlocked</p><p className="mt-2 text-2xl font-black">{workspace?.summary.unlocked_rewards ?? 0}</p></div>
                  <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-500/10"><p className="text-xs font-black uppercase text-violet-600 dark:text-violet-300">Claimed</p><p className="mt-2 text-2xl font-black">{workspace?.summary.rewards_bought ?? 0}</p></div>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {workspace?.journeys.flatMap((journey) => rewardFilter === "all" || rewardFilter === journey.id ? journey.rewards.map((reward) => ({ journey, reward })) : []).length ? workspace?.journeys.flatMap((journey) => rewardFilter === "all" || rewardFilter === journey.id ? journey.rewards.map((reward) => ({ journey, reward })) : []).map(({ journey, reward }) => {
                    const progress = Math.min(100, (journey.current_days / reward.target_days) * 100);
                    return (
                      <article key={reward.id} className={`rounded-2xl border p-5 ${reward.purchased ? "border-violet-300 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10" : reward.unlocked ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10" : "border-slate-200 dark:border-white/10"}`}>
                        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{journey.name}</p><h3 className="mt-1 font-black">{reward.title}</h3></div><span className="rounded-full border border-current/10 px-2 py-1 text-[10px] font-black uppercase">{reward.purchased ? "Claimed" : reward.unlocked ? "Unlocked" : "Locked"}</span></div>
                        <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500"><span>Unlock at {reward.target_days} days</span><span>{Math.min(reward.target_days, Math.floor(journey.current_days))}/{reward.target_days} days</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${progress}%` }} /></div>
                        {reward.estimated_cost > 0 && <p className="mt-3 text-xs font-bold text-slate-500">Estimated cost: ${reward.estimated_cost}</p>}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button disabled={!reward.unlocked} onClick={async () => { await toggleQuitReward(reward.id, { purchased: !reward.purchased }); await reload(); }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950">{reward.purchased ? "Mark unclaimed" : "Claim reward"}</button>
                          <button onClick={() => openRewardEdit(journey.id, reward)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black dark:border-white/10"><Edit3 className="mr-1 inline h-3.5 w-3.5" />Edit</button>
                          <button onClick={() => void removeReward(reward)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 dark:border-rose-500/30 dark:text-rose-300"><Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete</button>
                        </div>
                      </article>
                    );
                  }) : <div className="col-span-full rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-white/10"><Gift className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-black">No rewards planned yet</p><p className="mt-1 text-sm text-slate-500">Add something motivating for your next milestone.</p></div>}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.035]">
                <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-cyan-500" /><div><h2 className="text-xl font-black">Reset calendar</h2><p className="text-xs text-slate-500">Select any past day to record a missed reset.</p></div></div><button onClick={() => openReset()} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-white/10"><Plus className="mr-1 inline h-4 w-4" />Add reset</button></div>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const key = day.toISOString().slice(0, 10);
                    const events = workspace?.calendar.filter((item) => item.date === key) ?? [];
                    const today = new Date().toDateString() === day.toDateString();
                    return <button key={key} onClick={() => openReset(undefined, day)} className={`min-h-16 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:border-violet-400 ${events.length ? "border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10" : today ? "border-cyan-300 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10" : "border-slate-200 dark:border-white/10"}`}><span className="text-xs font-black">{day.getDate()}</span>{events.length > 0 && <span className="mt-2 block text-[10px] font-black uppercase text-rose-600 dark:text-rose-300">{events.length} reset{events.length > 1 ? "s" : ""}</span>}</button>;
                  })}
                </div>
                <div className="mt-5 max-h-52 space-y-2 overflow-y-auto pr-1">{workspace?.calendar.length ? workspace.calendar.map((event, index) => { const journey = workspace.journeys.find((item) => item.id === event.journey_id); return <div key={`${event.date}-${index}`} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">{journey?.name ?? "Journey"}</p><p className="text-xs font-bold text-slate-500">{new Date(`${event.date}T12:00:00`).toLocaleDateString()}</p></div><p className="mt-1 text-xs text-slate-500">{event.trigger || "Reset recorded"}{event.note ? ` — ${event.note}` : ""}</p></div>; }) : <p className="py-6 text-center text-sm text-slate-500">No resets recorded yet.</p>}</div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 dark:border-white/10 dark:bg-white/[.035]">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3"><Award className="h-5 w-5 text-amber-500" /><h2 className="text-xl font-black">Achievement roadmap</h2></div>
                    <p className="mt-2 text-sm text-slate-500">Every milestone is visible. Your best streak unlocks progress across the complete path.</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right dark:bg-amber-500/10">
                    <p className="text-xs font-black uppercase tracking-[.12em] text-amber-600 dark:text-amber-300">Unlocked</p>
                    <p className="text-xl font-black">{workspace?.achievements.filter((item) => item.unlocked).length ?? 0} / {workspace?.achievements.length ?? 0}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {workspace?.achievements.map((achievement) => (
                    <div key={`${achievement.category}-${achievement.days}`} className={`relative overflow-hidden rounded-2xl border p-4 ${achievement.unlocked ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10" : "border-slate-200 dark:border-white/10"}`}>
                      <div className="flex items-start justify-between gap-3"><Trophy className={`h-6 w-6 ${achievement.unlocked ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`} /><span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-black uppercase tracking-[.1em] text-slate-500 dark:bg-white/5">{achievement.category}</span></div>
                      <p className="mt-4 text-sm font-black">{achievement.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{achievement.days} day{achievement.days === 1 ? "" : "s"}</p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-violet-500" style={{ width: `${achievement.progress}%` }} /></div>
                      <p className="mt-2 text-[10px] font-black uppercase text-slate-400">{achievement.unlocked ? "Unlocked" : `${achievement.progress}% complete`}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />

      {journeyModal && (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitJourney} className="my-6 w-full max-w-3xl rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-violet-500">{editing ? "Update journey" : "New journey"}</p><h2 className="mt-1 text-2xl font-black">{editing ? `Edit ${editing.name}` : "Create a habit-breaking plan"}</h2></div><button type="button" onClick={() => setJourneyModal(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Habit name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Example: Doomscrolling after midnight" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 outline-none focus:border-violet-500 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-950"><option value="digital">Digital</option><option value="food">Food</option><option value="spending">Spending</option><option value="substance">Substance</option><option value="behaviour">Behaviour</option><option value="other">Other</option></select></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Accent</span><input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent p-2 dark:border-white/10" /></label>
              <label className="sm:col-span-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Current streak started</span><input type="datetime-local" required max={toLocalInput(new Date())} value={form.quit_at} onChange={(event) => setForm({ ...form, quit_at: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Cost each time</span><input type="number" min="0" step="0.01" value={form.cost_per_occurrence} onChange={(event) => setForm({ ...form, cost_per_occurrence: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Times per week</span><input type="number" min="0" step="0.5" value={form.occurrences_per_week} onChange={(event) => setForm({ ...form, occurrences_per_week: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Minutes each time</span><input type="number" min="0" value={form.minutes_per_occurrence} onChange={(event) => setForm({ ...form, minutes_per_occurrence: Number(event.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Replacement strategy</span><input value={form.strategy} onChange={(event) => setForm({ ...form, strategy: event.target.value })} placeholder="Walk, breathe, call a friend..." className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Reasons to quit</span><textarea value={whyText} onChange={(event) => setWhyText(event.target.value)} placeholder="One reason per line" className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-transparent p-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Known triggers</span><textarea value={triggerText} onChange={(event) => setTriggerText(event.target.value)} placeholder="One trigger per line" className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-transparent p-4 dark:border-white/10" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setJourneyModal(false)} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black dark:border-white/10">Cancel</button><button disabled={saving} className="flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editing ? "Save changes" : "Create journey"}</button></div>
          </form>
        </div>
      )}

      {rewardOpen && (
        <div className="fixed inset-0 z-[85] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitReward} className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-violet-500">Rewards Vault</p><h2 className="mt-1 text-2xl font-black">{editingReward ? "Edit reward" : "Plan a reward"}</h2></div><button type="button" onClick={() => setRewardOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 space-y-4">
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Journey</span><select required disabled={Boolean(editingReward)} value={rewardJourneyId ?? ""} onChange={(event) => setRewardJourneyId(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950"><option value="" disabled>Select a journey</option>{workspace?.journeys.filter((journey) => journey.is_active).map((journey) => <option key={journey.id} value={journey.id}>{journey.name}</option>)}</select></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Reward</span><input required value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} placeholder="Example: Movie night, new book, day trip" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Unlock after days</span><input type="number" min="1" required value={rewardDays} onChange={(event) => setRewardDays(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label><label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Estimated cost</span><input type="number" min="0" step="0.01" value={rewardCost} onChange={(event) => setRewardCost(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setRewardOpen(false)} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black dark:border-white/10">Cancel</button><button disabled={saving || !rewardJourneyId} className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}{editingReward ? "Save reward" : "Add reward"}</button></div>
          </form>
        </div>
      )}

      {resetOpen && (
        <div className="fixed inset-0 z-[85] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitReset} className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-rose-500">Honest progress</p><h2 className="mt-1 text-2xl font-black">Record a reset</h2><p className="mt-2 text-sm text-slate-500">You can record today or a missed day from the calendar.</p></div><button type="button" onClick={() => setResetOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 space-y-4">
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Journey</span><select required value={resetJourneyId ?? ""} onChange={(event) => setResetJourneyId(Number(event.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-950"><option value="" disabled>Select a journey</option>{workspace?.journeys.filter((journey) => journey.is_active).map((journey) => <option key={journey.id} value={journey.id}>{journey.name}</option>)}</select></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">When did it happen?</span><input type="datetime-local" required max={toLocalInput(new Date())} value={resetAt} onChange={(event) => setResetAt(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Trigger</span><input value={resetTrigger} onChange={(event) => setResetTrigger(event.target.value)} placeholder="Stress, boredom, social pressure..." className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-transparent px-4 dark:border-white/10" /></label>
              <label><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Lesson or note</span><textarea value={resetNote} onChange={(event) => setResetNote(event.target.value)} placeholder="What can help next time?" className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-transparent p-4 dark:border-white/10" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setResetOpen(false)} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black dark:border-white/10">Cancel</button><button disabled={saving || !resetJourneyId} className="flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Record reset</button></div>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[75] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-slate-950 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-violet-500">Journey analysis</p><h2 className="mt-1 text-2xl font-black">{selected.name}</h2></div><button onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><Coins className="h-5 w-5 text-emerald-500" /><p className="mt-3 text-2xl font-black">${selected.money_saved}</p><p className="text-xs text-slate-500">Estimated saved</p></div><div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><Clock3 className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-2xl font-black">{Math.round(selected.time_saved_minutes / 60)}h</p><p className="text-xs text-slate-500">Time reclaimed</p></div><div className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><Target className="h-5 w-5 text-violet-500" /><p className="mt-3 text-2xl font-black">{selected.longest_days}d</p><p className="text-xs text-slate-500">Best streak</p></div></div>
            {selected.strategy && <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><p className="text-xs font-black uppercase tracking-[.12em] text-violet-500">Replacement plan</p><p className="mt-2 text-sm font-semibold">{selected.strategy}</p></div>}
            <div className="mt-5"><div className="flex items-center justify-between"><h3 className="font-black">Rewards</h3><button onClick={() => openRewardCreate(selected)} className="text-sm font-black text-violet-500">+ Add reward</button></div><div className="mt-3 space-y-2">{selected.rewards.length ? selected.rewards.map((reward) => <button key={reward.id} disabled={!reward.unlocked} onClick={async () => { await toggleQuitReward(reward.id, { purchased: !reward.purchased }); await reload(); setSelected(null); }} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left disabled:opacity-50 dark:border-white/10"><span><b>{reward.title}</b><span className="block text-xs text-slate-500">Unlocks at {reward.target_days} days</span></span><span className="text-xs font-black uppercase">{reward.purchased ? "Claimed" : reward.unlocked ? "Claim" : "Locked"}</span></button>) : <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10">No rewards added yet.</p>}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
