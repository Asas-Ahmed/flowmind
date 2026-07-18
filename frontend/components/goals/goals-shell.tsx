"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, LoaderCircle, Pencil, Plus, Sparkles, Target, Trash2, X } from "lucide-react";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { createGoal, deleteGoal, getGoalsWorkspace, updateGoal } from "@/lib/api";
import type { Goal, GoalPayload, GoalsWorkspace, GoalType } from "@/types/goals";

const colors = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#ea580c", "#e11d48"];
const types: { value: GoalType; label: string; unit: string }[] = [
  { value: "tasks", label: "Tasks completed", unit: "tasks" },
  { value: "focus_minutes", label: "Focus time", unit: "minutes" },
  { value: "habit_completions", label: "Habit completions", unit: "check-ins" },
  { value: "tracked_minutes", label: "Tracked work", unit: "minutes" },
];

export function GoalsShell() {
  const [workspace, setWorkspace] = useState<GoalsWorkspace | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState(""); const [goalType, setGoalType] = useState<GoalType>("tasks"); const [target, setTarget] = useState("10"); const [color, setColor] = useState(colors[0]);

  const reload = () => getGoalsWorkspace().then(setWorkspace).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load goals.")).finally(() => setLoading(false));
  useEffect(() => { const id = window.setTimeout(() => void reload(), 0); return () => window.clearTimeout(id); }, []);
  const active = useMemo(() => workspace?.goals.filter((goal) => goal.is_active) ?? [], [workspace]);
  const openCreate = () => { setEditing(null); setTitle(""); setGoalType("tasks"); setTarget("10"); setColor(colors[0]); setOpen(true); };
  const openEdit = (goal: Goal) => { setEditing(goal); setTitle(goal.title); setGoalType(goal.goal_type); setTarget(String(goal.target_value)); setColor(goal.color); setOpen(true); };
  const save = async () => {
    const value = Number(target);
    if (!title.trim() || !Number.isFinite(value) || value < 1) return;

    setSaving(true);
    setError("");

    const payload: GoalPayload = {
      title: title.trim(),
      goal_type: goalType,
      target_value: Math.round(value),
      color,
    };

    try {
      if (editing) {
        await updateGoal(editing.id, payload);
      } else {
        await createGoal(payload);
      }

      setOpen(false);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save goal.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (goal: Goal) => { if (!window.confirm(`Delete “${goal.title}”?`)) return; setSaving(true); try { await deleteGoal(goal.id); await reload(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete goal."); } finally { setSaving(false); } };
  const toggle = async (goal: Goal) => { setSaving(true); try { await updateGoal(goal.id, { is_active: !goal.is_active }); await reload(); } finally { setSaving(false); } };
  const selectedType = types.find((item) => item.value === goalType)!;

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
    <WorkspaceSidebar insightTitle="Targets create direction" insightText="Use a few realistic weekly outcomes. FlowMind updates progress automatically from the work you already log." insightValue={`${workspace?.summary.average_progress ?? 0}% weekly`} />
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
      <WorkspaceTopbar eyebrow="Outcome planning" title="Goals & Targets" description="Set measurable weekly outcomes across tasks, focus, habits, and tracked work." />
      <div className="mx-auto max-w-[1450px] space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}
        {loading ? <div className="grid min-h-[420px] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" /></div> : <>
          <section className="grid gap-4 md:grid-cols-3">
            {[{ label: "Active goals", value: workspace?.summary.total_goals ?? 0, Icon: Target }, { label: "Completed", value: workspace?.summary.completed_goals ?? 0, Icon: CheckCircle2 }, { label: "Average progress", value: `${workspace?.summary.average_progress ?? 0}%`, Icon: Clock3 }].map(({ label, value, Icon }) => <div key={label} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><Icon className="h-5 w-5 text-indigo-500" /><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
          </section>
          <section className="rounded-[28px] border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-cyan-50 p-5 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-cyan-500/5 sm:p-6"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm dark:bg-white/10"><Sparkles className="h-5 w-5 text-indigo-500" /></span><div><p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Flow Assistant</p><p className="mt-2 font-bold leading-7">{workspace?.suggestion}</p></div></div></section>
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">This week</p><h2 className="mt-1 text-2xl font-black">Weekly outcomes</h2><p className="mt-1 text-sm text-slate-500">{workspace?.summary.week_start} — {workspace?.summary.week_end}</p></div><button type="button" onClick={openCreate} className="flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /> New goal</button></div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">{active.length ? active.map((goal) => <article key={goal.id} className="rounded-[24px] border border-slate-200 p-5 dark:border-white/10"><div className="flex items-start gap-3"><span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: goal.color }} /><div className="min-w-0 flex-1"><p className="truncate text-lg font-black">{goal.title}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{types.find((item) => item.value === goal.goal_type)?.label}</p></div><button onClick={() => openEdit(goal)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10"><Pencil className="h-4 w-4" /></button><button disabled={saving} onClick={() => void remove(goal)} className="grid h-9 w-9 place-items-center rounded-xl border border-red-200 text-red-600 dark:border-red-500/30 dark:text-red-400"><Trash2 className="h-4 w-4" /></button></div><div className="mt-6 flex items-end justify-between"><div><p className="text-3xl font-black">{goal.display_current}</p><p className="mt-1 text-sm text-slate-500">of {goal.display_target}</p></div><p className="text-lg font-black" style={{ color: goal.color }}>{goal.percentage}%</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(goal.percentage, 2)}%`, backgroundColor: goal.color }} /></div><p className="mt-3 text-xs font-bold text-slate-500">{goal.is_complete ? "Target achieved — excellent consistency." : `${goal.remaining_value} remaining this week.`}</p></article>) : <div className="col-span-full py-14 text-center"><Target className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-black">No weekly goals yet</p><p className="mt-1 text-sm text-slate-500">Create a target and FlowMind will calculate progress automatically.</p></div>}</div>
          </section>
          {workspace?.goals.some((goal) => !goal.is_active) && <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.035]"><h2 className="font-black">Paused goals</h2><div className="mt-4 flex flex-wrap gap-2">{workspace.goals.filter((goal) => !goal.is_active).map((goal) => <button key={goal.id} onClick={() => void toggle(goal)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-white/10">Resume {goal.title}</button>)}</div></section>}
        </>}
      </div>
    </motion.main><WorkspaceNavigation variant="mobile" />
    {open && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-500">Weekly target</p><h2 className="mt-1 text-2xl font-black">{editing ? "Edit goal" : "Create goal"}</h2></div><button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-400"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-4"><label className="block text-sm font-bold">Goal name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Complete important tasks" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label><label className="block text-sm font-bold">Measure<select value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111522]">{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block text-sm font-bold">Weekly target ({selectedType.unit})<input type="number" min="1" value={target} onChange={(event) => setTarget(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111522]" /></label><div className="flex gap-2">{colors.map((item) => <button key={item} type="button" onClick={() => setColor(item)} className={`h-9 w-9 rounded-xl ${color === item ? "ring-2 ring-offset-2 dark:ring-offset-[#0b0f19]" : ""}`} style={{ backgroundColor: item }} />)}</div></div><div className="mt-6 flex gap-3">{editing && <button disabled={saving} onClick={() => void toggle(editing)} className="h-12 flex-1 rounded-xl border border-slate-200 font-black dark:border-white/10">{editing.is_active ? "Pause goal" : "Resume goal"}</button>}<button disabled={saving} onClick={() => void save()} className="h-12 flex-1 rounded-xl bg-slate-950 font-black text-white dark:bg-white dark:text-slate-950">{saving ? "Saving..." : "Save goal"}</button></div></div></div>}
  </div>;
}
