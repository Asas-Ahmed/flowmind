"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleSlash2,
  Clock3,
  Lightbulb,
  MapPin,
  Plus,
  RefreshCw,
  Repeat2,
  Sparkles,
  Target,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createIfThenPlan,
  deleteIfThenPlan,
  getIfThenWorkspace,
  recordIfThenOutcome,
  updateIfThenPlan,
} from "@/lib/api";
import type {
  IfThenCategory,
  IfThenPlan,
  IfThenTriggerType,
  IfThenWorkspace,
} from "@/types/if-then";

const triggerOptions: Array<{
  value: IfThenTriggerType;
  label: string;
  example: string;
}> = [
  { value: "time", label: "Time", example: "it is 7 PM" },
  { value: "routine", label: "Routine", example: "I finish lunch" },
  { value: "situation", label: "Situation", example: "I feel distracted" },
  { value: "emotion", label: "Feeling", example: "I feel overwhelmed" },
  { value: "location", label: "Location", example: "I sit at my desk" },
];

const categories: IfThenCategory[] = [
  "productivity",
  "focus",
  "study",
  "habit",
  "wellbeing",
];

const templates: Array<{
  triggerType: IfThenTriggerType;
  trigger: string;
  action: string;
  category: IfThenCategory;
}> = [
  {
    triggerType: "time",
    trigger: "it is 7 PM",
    action: "study for 25 minutes",
    category: "study",
  },
  {
    triggerType: "routine",
    trigger: "I finish lunch",
    action: "walk for 5 minutes",
    category: "wellbeing",
  },
  {
    triggerType: "situation",
    trigger: "I notice myself checking my phone",
    action: "put it away and restart a 10-minute focus block",
    category: "focus",
  },
];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Target;
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
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Planner
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export function IfThenPlannerShell() {
  const [workspace, setWorkspace] = useState<IfThenWorkspace | null>(null);
  const [triggerType, setTriggerType] = useState<IfThenTriggerType>("time");
  const [triggerText, setTriggerText] = useState("");
  const [actionText, setActionText] = useState("");
  const [category, setCategory] = useState<IfThenCategory>("productivity");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getIfThenWorkspace());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the If–Then Planner",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getIfThenWorkspace()
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load the If–Then Planner",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const preview = useMemo(
    () => `If ${triggerText.trim() || "the trigger happens"}, then I will ${actionText.trim() || "take one clear action"}.`,
    [actionText, triggerText],
  );

  function applyTemplate(template: (typeof templates)[number]) {
    setTriggerType(template.triggerType);
    setTriggerText(template.trigger);
    setActionText(template.action);
    setCategory(template.category);
    setSaved(false);
  }

  async function savePlan() {
    if (!triggerText.trim() || !actionText.trim()) {
      setError("Enter both a specific trigger and a clear action");
      return;
    }

    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await createIfThenPlan({
        trigger_type: triggerType,
        trigger_text: triggerText.trim(),
        action_text: actionText.trim(),
        category,
        note: note.trim() || null,
      });
      setTriggerText("");
      setActionText("");
      setNote("");
      setSaved(true);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this If–Then plan",
      );
    } finally {
      setBusy(false);
    }
  }

  async function recordOutcome(plan: IfThenPlan, outcome: "success" | "skip") {
    setWorkingId(plan.id);
    setError("");
    try {
      await recordIfThenOutcome(plan.id, outcome);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record this outcome",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function togglePlan(plan: IfThenPlan) {
    setWorkingId(plan.id);
    setError("");
    try {
      await updateIfThenPlan(plan.id, { is_active: !plan.is_active });
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this plan",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function removePlan(plan: IfThenPlan) {
    if (!window.confirm(`Delete “If ${plan.trigger_text}, then ${plan.action_text}”?`)) return;
    setWorkingId(plan.id);
    setError("");
    try {
      await deleteIfThenPlan(plan.id);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this plan",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Implementation intentions"
        insightText="Link one recognizable situation to one small action. Specific rules are easier to follow than vague goals."
        insightValue={workspace?.active_plans ? `${workspace.active_plans} active` : "Ready"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar
          eyebrow="Behaviour design"
          title="If–Then Action Planner"
          description="Create specific implementation intentions, practise them when the trigger appears, and track which rules help you follow through."
          actions={
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:text-white"
              aria-label="Refresh If–Then Planner"
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
            <StatCard icon={Repeat2} label="Active plans" value={`${workspace?.active_plans ?? 0}`} detail={`${workspace?.total_plans ?? 0} plans created`} />
            <StatCard icon={CheckCircle2} label="Successful actions" value={`${workspace?.total_successes ?? 0}`} detail={`${workspace?.total_attempts ?? 0} outcomes recorded`} />
            <StatCard icon={Target} label="Follow-through rate" value={`${workspace?.success_rate ?? 0}%`} detail="Successful actions divided by recorded triggers" />
            <StatCard icon={Zap} label="Strongest category" value={workspace?.strongest_category ? titleCase(workspace.strongest_category) : "Not yet"} detail="Based on plans with successful follow-through" />
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Create a rule</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Connect a trigger to one action</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Keep the trigger observable and make the action small enough to begin immediately.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-5">
                {triggerOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTriggerType(option.value)}
                    className={`rounded-2xl border p-3 text-left transition ${triggerType === option.value ? "border-violet-400 bg-violet-50 ring-4 ring-violet-500/10 dark:border-cyan-400/40 dark:bg-cyan-400/[0.08]" : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.025]"}`}
                  >
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{option.example}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">If...</span>
                  <input value={triggerText} onChange={(event) => setTriggerText(event.target.value)} maxLength={220} placeholder="I finish lunch" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Then I will...</span>
                  <input value={actionText} onChange={(event) => setActionText(event.target.value)} maxLength={220} placeholder="walk for 5 minutes" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value as IfThenCategory)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none dark:border-white/10 dark:bg-[#111522]">
                    {categories.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Optional note</span>
                  <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Why this rule matters or how to make it easier" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]" />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-cyan-400/15 dark:bg-cyan-400/[0.06]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Plan preview</p>
                <p className="mt-2 text-sm font-bold leading-6">{preview}</p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {templates.map((template, index) => (
                    <button key={template.trigger} type="button" onClick={() => applyTemplate(template)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:text-slate-300 dark:hover:text-cyan-300">
                      Template {index + 1}
                    </button>
                  ))}
                </div>
                <button type="button" disabled={busy} onClick={() => void savePlan()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                  <Plus className="h-4 w-4" />
                  {busy ? "Saving..." : "Create plan"}
                </button>
              </div>
              {saved && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">Your If–Then plan was saved.</p>}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-6 text-white shadow-xl shadow-indigo-500/15">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Flow Assistant</p>
                  <h2 className="text-xl font-black">{workspace?.insight.title ?? "Build a reliable cue"}</h2>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-white/85">{workspace?.insight.message ?? "Create your first plan to begin tracking follow-through."}</p>
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Suggested adjustment</p>
                    <p className="mt-2 text-sm font-semibold leading-6">{workspace?.insight.action ?? "Choose a trigger you already notice every day."}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Follow-through</span>
                  <span className="text-3xl font-black">{workspace?.success_rate ?? 0}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${workspace?.success_rate ?? 0}%` }} className="h-full rounded-full bg-white" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-cyan-300">Practice board</p>
                <h2 className="mt-1 text-xl font-black">Your action rules</h2>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {!workspace?.plans.length && (
                <div className="xl:col-span-2 rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center dark:border-white/15">
                  <Repeat2 className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-bold">No If–Then plans yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use a template or create a specific rule above.</p>
                </div>
              )}

              {workspace?.plans.map((plan) => {
                const attempts = plan.success_count + plan.skip_count;
                const rate = attempts ? Math.round((plan.success_count / attempts) * 100) : 0;
                return (
                  <article key={plan.id} className={`rounded-2xl border p-4 transition ${plan.is_active ? "border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.025]" : "border-slate-200/60 bg-slate-100/60 opacity-70 dark:border-white/[0.05] dark:bg-white/[0.015]"}`}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm dark:bg-white/[0.07] dark:text-cyan-300">
                        {plan.trigger_type === "location" ? <MapPin className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-cyan-400/10 dark:text-cyan-300">{titleCase(plan.trigger_type)}</span>
                          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">{titleCase(plan.category)}</span>
                        </div>
                        <p className="mt-3 text-sm font-bold leading-6"><span className="text-violet-600 dark:text-cyan-300">If</span> {plan.trigger_text}, <span className="text-violet-600 dark:text-cyan-300">then</span> I will {plan.action_text}.</p>
                        {plan.note && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{plan.note}</p>}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/[0.07]">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-black text-slate-800 dark:text-slate-200">{rate}%</span> success · {plan.success_count} done · {plan.skip_count} skipped
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" disabled={workingId === plan.id || !plan.is_active} onClick={() => void recordOutcome(plan, "success")} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40 dark:bg-emerald-400/10 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Done</button>
                        <button type="button" disabled={workingId === plan.id || !plan.is_active} onClick={() => void recordOutcome(plan, "skip")} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-50 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-40 dark:bg-amber-400/10 dark:text-amber-300"><CircleSlash2 className="h-4 w-4" />Skipped</button>
                        <button type="button" disabled={workingId === plan.id} onClick={() => void togglePlan(plan)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-200 dark:hover:bg-white/[0.07]" aria-label={plan.is_active ? "Pause plan" : "Activate plan"}>{plan.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}</button>
                        <button type="button" disabled={workingId === plan.id} onClick={() => void removePlan(plan)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-300" aria-label="Delete plan"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
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
