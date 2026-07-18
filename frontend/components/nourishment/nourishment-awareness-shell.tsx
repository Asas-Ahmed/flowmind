"use client";

import { motion } from "framer-motion";
import { Droplets, GlassWater, RefreshCw, Salad, Sparkles, Trash2, Utensils, Wheat } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { createNourishmentLog, deleteNourishmentLog, getNourishmentWorkspace } from "@/lib/api";
import type { MealType, NourishmentLogPayload, NourishmentWorkspace } from "@/types/nourishment";

const mealOptions: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
];

export function NourishmentAwarenessShell() {
  const [workspace, setWorkspace] = useState<NourishmentWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const loadWorkspace = useCallback(async () => {
    try {
      setError("");
      setWorkspace(await getNourishmentWorkspace());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load nourishment awareness.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadWorkspace]);

  async function addLog(payload: NourishmentLogPayload) {
    setBusy(true);
    try {
      await createNourishmentLog({ ...payload, note: note.trim() || undefined });
      setNote("");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the log.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLog(logId: number) {
    setBusy(true);
    try {
      await deleteNourishmentLog(logId);
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the log.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadWorkspace();
    setRefreshing(false);
  }

  const highestWater = useMemo(
    () => Math.max(...(workspace?.daily_points ?? []).map((point) => point.water_ml), 1),
    [workspace],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Support your work rhythm"
        insightText="Use lightweight hydration and meal awareness without calorie tracking or medical claims."
        insightValue={`${workspace?.today_water_ml ?? 0} ml`}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-10">
        <WorkspaceTopbar
          eyebrow="Wellbeing awareness"
          title="Hydration & Meal Awareness"
          description="Notice water and meal patterns during long workdays with quick, pressure-free logging."
        />

        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={() => void refresh()} className="rounded-xl px-3 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/10">Retry</button>
            </div>
          )}

          <section className="relative overflow-hidden rounded-[32px] border border-cyan-200/70 bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-6 text-white shadow-[0_24px_80px_rgba(37,99,235,0.2)] sm:p-8">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100"><Sparkles className="h-4 w-4" /> Flow Assistant</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{workspace?.assistant_title ?? "Building today’s awareness"}</h1>
                <p className="mt-3 text-sm leading-7 text-blue-50 sm:text-base">{workspace?.assistant_message ?? "Add a quick water or meal log to begin."}</p>
                <p className="mt-4 text-xs leading-5 text-blue-100">This feature supports routine awareness only. It does not provide nutrition, dietary, or medical advice.</p>
              </div>
              <button type="button" disabled={refreshing} onClick={() => void refresh()} className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20 disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [Droplets, "Water today", `${workspace?.today_water_ml ?? 0} ml`, `${workspace?.water_progress ?? 0}% of ${workspace?.water_target_ml ?? 2000} ml awareness target`],
              [Utensils, "Meals logged", String(workspace?.today_meals ?? 0), `${workspace?.meals_progress ?? 0}% of the daily rhythm`],
              [Sparkles, "Current streak", `${workspace?.current_streak ?? 0} days`, "Days with meaningful water or meal awareness"],
              [GlassWater, "Weekly average", `${workspace?.weekly_water_average_ml ?? 0} ml`, `${workspace?.weekly_meal_average ?? 0} meals logged per day`],
            ].map(([Icon, label, value, detail]) => {
              const CardIcon = Icon as typeof Droplets;
              return (
                <article key={String(label)} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                  <CardIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                  <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{String(label)}</p>
                  <p className="mt-1 text-3xl font-black">{String(value)}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{String(detail)}</p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300"><Droplets className="h-5 w-5" /></span><div><h2 className="text-xl font-black">Quick hydration log</h2><p className="text-sm text-slate-500 dark:text-slate-400">Add the amount you just drank.</p></div></div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[250, 350, 500].map((amount) => <button key={amount} type="button" disabled={busy} onClick={() => void addLog({ kind: "water", amount_ml: amount })} className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-4 text-sm font-black text-cyan-800 transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">{amount} ml</button>)}
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${workspace?.water_progress ?? 0}%` }} /></div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Salad className="h-5 w-5" /></span><div><h2 className="text-xl font-black">Quick meal awareness</h2><p className="text-sm text-slate-500 dark:text-slate-400">Record a meal without calories or judgement.</p></div></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {mealOptions.map((meal) => <button key={meal.id} type="button" disabled={busy} onClick={() => void addLog({ kind: "meal", meal_type: meal.id })} className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-4 text-sm font-black text-amber-800 transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"><Wheat className="h-4 w-4" />{meal.label}</button>)}
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <label htmlFor="nourishment-note" className="text-sm font-black">Optional note for your next quick log</label>
            <input id="nourishment-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} placeholder="Example: after focus session, with lunch, felt refreshed…" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-white/[0.04]" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <h2 className="text-xl font-black">Seven-day hydration view</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Logged water amounts, not a clinical hydration measure.</p>
              <div className="mt-7 flex h-52 items-end gap-2">
                {(workspace?.daily_points ?? []).map((point) => (
                  <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{point.water_ml || ""}</span>
                    <div className="flex h-36 w-full items-end rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]"><div className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: `${point.water_ml ? Math.max(8, point.water_ml / highestWater * 100) : 0}%` }} /></div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">{new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
              <h2 className="text-xl font-black">Recent awareness logs</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Delete any entry that was added by mistake.</p>
              <div className="mt-5 space-y-3">
                {(workspace?.recent_logs ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10">No hydration or meal logs yet.</div>}
                {(workspace?.recent_logs ?? []).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${log.kind === "water" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300" : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"}`}>{log.kind === "water" ? <Droplets className="h-5 w-5" /> : <Utensils className="h-5 w-5" />}</span>
                    <div className="min-w-0 flex-1"><p className="font-black capitalize">{log.kind === "water" ? `${log.amount_ml} ml water` : log.meal_type}</p><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{log.note || new Date(log.logged_at).toLocaleString()}</p></div>
                    <button type="button" disabled={busy} onClick={() => void removeLog(log.id)} aria-label="Delete nourishment log" className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />
    </div>
  );
}
