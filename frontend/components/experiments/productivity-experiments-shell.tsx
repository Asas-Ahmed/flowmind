"use client";

import { motion } from "framer-motion";
import { Beaker, CheckCircle2, ClipboardPlus, FlaskConical, Lightbulb, RefreshCw, Scale, Target, Trash2, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { completeProductivityExperiment, createProductivityExperiment, deleteProductivityExperiment, getExperimentWorkspace, recordProductivityExperimentTrial } from "@/lib/api";
import type { ExperimentCondition, ExperimentMetric, ExperimentWorkspace, ProductivityExperiment } from "@/types/experiment";

const metrics: Array<{ value: ExperimentMetric; label: string }> = [
  { value: "focus_rating", label: "Focus rating" },
  { value: "productivity_score", label: "Productivity score" },
  { value: "completion_quality", label: "Completion quality" },
  { value: "energy_after", label: "Energy afterward" },
];

const templates = [
  ["Phone location", "Phone nearby", "Phone in another room"],
  ["Best work time", "Morning session", "Evening session"],
  ["Focus duration", "25-minute session", "40-minute session"],
  ["Sound environment", "Music", "Silence"],
] as const;

function metricLabel(value: ExperimentMetric) {
  return metrics.find((item) => item.value === value)?.label ?? value;
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Beaker; label: string; value: string; detail: string }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-violet-600 dark:bg-white/[0.07] dark:text-cyan-300"><Icon className="h-5 w-5" /></div>
    <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
  </div>;
}

function ResultBar({ label, average, count, winner }: { label: string; average: number | null; count: number; winner: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
    <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-bold">{label}</p><span className="font-black">{average === null ? "—" : average.toFixed(1)}</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className={`h-full rounded-full ${winner ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-slate-400 dark:bg-slate-600"}`} style={{ width: average ? `${average * 10}%` : "0%" }} /></div>
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{count} trial{count === 1 ? "" : "s"}</p>
  </div>;
}

export function ProductivityExperimentsShell() {
  const [workspace, setWorkspace] = useState<ExperimentWorkspace | null>(null);
  const [title, setTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [conditionA, setConditionA] = useState("");
  const [conditionB, setConditionB] = useState("");
  const [metric, setMetric] = useState<ExperimentMetric>("focus_rating");
  const [trialExperiment, setTrialExperiment] = useState<ProductivityExperiment | null>(null);
  const [trialCondition, setTrialCondition] = useState<ExperimentCondition>("A");
  const [trialScore, setTrialScore] = useState(7);
  const [trialNote, setTrialNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setError("");
    try { setWorkspace(await getExperimentWorkspace()); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load experiments"); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getExperimentWorkspace().then((data) => { if (!cancelled) setWorkspace(data); }).catch((requestError: unknown) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load experiments");
    });
    return () => { cancelled = true; };
  }, []);

  function applyTemplate(template: (typeof templates)[number]) {
    setTitle(template[0]); setConditionA(template[1]); setConditionB(template[2]);
    setHypothesis(`I expect “${template[2]}” to produce a better result.`);
  }

  async function saveExperiment() {
    if (!title.trim() || !conditionA.trim() || !conditionB.trim()) { setError("Add a title and two different conditions."); return; }
    setBusy(true); setError("");
    try {
      await createProductivityExperiment({ title: title.trim(), hypothesis: hypothesis.trim() || null, condition_a: conditionA.trim(), condition_b: conditionB.trim(), metric });
      setTitle(""); setHypothesis(""); setConditionA(""); setConditionB(""); await loadWorkspace();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create experiment"); }
    finally { setBusy(false); }
  }

  async function saveTrial() {
    if (!trialExperiment) return;
    setBusy(true); setError("");
    try {
      await recordProductivityExperimentTrial(trialExperiment.id, { condition: trialCondition, score: trialScore, note: trialNote.trim() || null });
      setTrialExperiment(null); setTrialNote(""); setTrialScore(7); await loadWorkspace();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to record trial"); }
    finally { setBusy(false); }
  }

  async function finish(experiment: ProductivityExperiment) {
    setUpdatingId(experiment.id); setError("");
    try { await completeProductivityExperiment(experiment.id); await loadWorkspace(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to complete experiment"); }
    finally { setUpdatingId(null); }
  }

  async function remove(experiment: ProductivityExperiment) {
    if (!window.confirm(`Delete “${experiment.title}” and all trials?`)) return;
    setUpdatingId(experiment.id); setError("");
    try { await deleteProductivityExperiment(experiment.id); await loadWorkspace(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to delete experiment"); }
    finally { setUpdatingId(null); }
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
    <WorkspaceSidebar insightTitle="Test, do not guess" insightText="Compare one change at a time and treat results as a personal pattern rather than scientific proof." insightValue={`${workspace?.active_experiments ?? 0} active`} />
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
      <WorkspaceTopbar eyebrow="Behaviour lab" title="Personal Productivity Experiments" description="Compare two work strategies, record repeated trials, and discover what works better for you." actions={<button type="button" onClick={() => void loadWorkspace()} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300" aria-label="Refresh experiments"><RefreshCw className="h-4 w-4" /></button>} />
      <div className="mx-auto max-w-[1800px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 xl:pb-10">
        {error && <div className="mb-5 flex justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"><span>{error}</span><button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}
        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard icon={FlaskConical} label="Experiments" value={String(workspace?.total_experiments ?? 0)} detail="All saved comparisons." />
          <StatCard icon={Beaker} label="Active" value={String(workspace?.active_experiments ?? 0)} detail="Currently collecting trials." />
          <StatCard icon={CheckCircle2} label="Completed" value={String(workspace?.completed_experiments ?? 0)} detail="Comparisons with results." />
          <StatCard icon={ClipboardPlus} label="Trials" value={String(workspace?.total_trials ?? 0)} detail="Scored work sessions." />
        </section>

        <section className="mt-6 grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-lg font-black">Create an experiment</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep everything except one condition as similar as possible.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">{templates.map((template) => <button key={template[0]} type="button" onClick={() => applyTemplate(template)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-xs font-bold transition hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.035]">{template[0]}</button>)}</div>
            <div className="mt-5 space-y-4">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Experiment title" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04]" />
              <textarea value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="What result do you expect?" rows={2} className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04]" />
              <div className="grid gap-3 sm:grid-cols-2"><input value={conditionA} onChange={(event) => setConditionA(event.target.value)} placeholder="Condition A" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04]" /><input value={conditionB} onChange={(event) => setConditionB(event.target.value)} placeholder="Condition B" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04]" /></div>
              <select value={metric} onChange={(event) => setMetric(event.target.value as ExperimentMetric)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#111522]">{metrics.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
              <button type="button" disabled={busy} onClick={() => void saveExperiment()} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"><FlaskConical className="h-4 w-4" />Create experiment</button>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 to-violet-950 p-6 text-white dark:border-white/10">
            <div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-cyan-300"><Lightbulb className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Flow Assistant</p><h2 className="mt-1 text-xl font-black">{workspace?.insight.title ?? "Build a fair comparison"}</h2></div></div>
            <p className="mt-5 text-sm leading-7 text-slate-300">{workspace?.insight.message ?? "Alternate conditions and score the same outcome after each session."}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next action</p><p className="mt-2 text-sm font-semibold">{workspace?.insight.next_action ?? "Create one simple comparison."}</p></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[0.06] p-4"><Scale className="h-5 w-5 text-violet-300" /><p className="mt-3 text-sm font-bold">Balanced</p><p className="mt-1 text-xs text-slate-400">Test both conditions equally.</p></div><div className="rounded-2xl bg-white/[0.06] p-4"><Target className="h-5 w-5 text-cyan-300" /><p className="mt-3 text-sm font-bold">Consistent</p><p className="mt-1 text-xs text-slate-400">Use one 1–10 metric.</p></div><div className="rounded-2xl bg-white/[0.06] p-4"><Trophy className="h-5 w-5 text-amber-300" /><p className="mt-3 text-sm font-bold">Personal</p><p className="mt-1 text-xs text-slate-400">Use results as guidance.</p></div></div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
          <h2 className="text-lg font-black">Your experiments</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Record a trial after each session and complete when the pattern is useful.</p>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">{(workspace?.experiments ?? []).map((experiment) => <article key={experiment.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{experiment.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${experiment.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"}`}>{experiment.status}</span></div><p className="mt-1 text-xs text-slate-500">{metricLabel(experiment.metric)}</p></div><button type="button" disabled={updatingId === experiment.id} onClick={() => void remove(experiment)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></div>
            {experiment.hypothesis && <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-300">“{experiment.hypothesis}”</p>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><ResultBar label={`A · ${experiment.condition_a}`} average={experiment.average_a} count={experiment.trial_count_a} winner={experiment.winner === "A"} /><ResultBar label={`B · ${experiment.condition_b}`} average={experiment.average_b} count={experiment.trial_count_b} winner={experiment.winner === "B"} /></div>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{experiment.confidence_note}</p>
            {experiment.status === "completed" && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Trophy className="h-4 w-4" />{experiment.winner ? `${experiment.winner === "A" ? experiment.condition_a : experiment.condition_b} had the higher average.` : "Both conditions had the same average."}</div>}
            {experiment.status === "active" && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setTrialExperiment(experiment); setTrialCondition("A"); }} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Record A</button><button type="button" onClick={() => { setTrialExperiment(experiment); setTrialCondition("B"); }} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white">Record B</button><button type="button" disabled={updatingId === experiment.id} onClick={() => void finish(experiment)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black dark:border-white/10 dark:bg-white/[0.04]">Complete</button></div>}
          </article>)}</div>
          {!workspace?.experiments.length && <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 p-10 text-center dark:border-white/15"><FlaskConical className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-bold">No experiments yet</p><p className="mt-1 text-sm text-slate-500">Create your first two-condition comparison.</p></div>}
        </section>
      </div>
    </motion.main>
    <WorkspaceNavigation variant="mobile" />

    {trialExperiment && <div className="fixed inset-0 z-[80] grid place-items-center p-4"><button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setTrialExperiment(null)} aria-label="Close" /><div className="relative w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
      <div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-cyan-300">Record trial</p><h2 className="mt-1 text-xl font-black">{trialExperiment.title}</h2></div><button type="button" onClick={() => setTrialExperiment(null)}><X className="h-5 w-5" /></button></div>
      <div className="mt-5 grid grid-cols-2 gap-3">{(["A", "B"] as ExperimentCondition[]).map((condition) => <button key={condition} type="button" onClick={() => setTrialCondition(condition)} className={`rounded-2xl border p-4 text-left ${trialCondition === condition ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" : "border-slate-200 dark:border-white/10"}`}><span className="text-xs font-black text-violet-600 dark:text-cyan-300">Condition {condition}</span><span className="mt-1 block text-sm font-bold">{condition === "A" ? trialExperiment.condition_a : trialExperiment.condition_b}</span></button>)}</div>
      <label className="mt-5 block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{metricLabel(trialExperiment.metric)} · {trialScore}/10</span><input type="range" min="1" max="10" value={trialScore} onChange={(event) => setTrialScore(Number(event.target.value))} className="mt-3 w-full accent-violet-600" /></label>
      <textarea value={trialNote} onChange={(event) => setTrialNote(event.target.value)} rows={3} placeholder="Optional note" className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/[0.04]" />
      <button type="button" disabled={busy} onClick={() => void saveTrial()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"><ClipboardPlus className="h-4 w-4" />Save trial</button>
    </div></div>}
  </div>;
}
