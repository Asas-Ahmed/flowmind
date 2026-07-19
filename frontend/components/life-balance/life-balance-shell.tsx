"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import {
  Apple,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Flame,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  House,
  LoaderCircle,
  MoonStar,
  Palette,
  Plus,
  RefreshCw,
  Smartphone,
  Sparkles,
  Sprout,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { deleteLifeBalanceCheckIn, getLifeBalanceWorkspace, saveLifeBalanceCheckIn } from "@/lib/api";
import type { LifeBalanceArea, LifeBalanceWorkspace } from "@/types/life-balance";

type IconType = ComponentType<{ className?: string }>;

const icons: Record<string, IconType> = {
  "heart-pulse": HeartPulse,
  brain: Brain,
  "moon-star": MoonStar,
  apple: Apple,
  "graduation-cap": GraduationCap,
  "briefcase-business": BriefcaseBusiness,
  "wallet-cards": WalletCards,
  "heart-handshake": HeartHandshake,
  users: Users,
  sparkles: Sparkles,
  sprout: Sprout,
  house: House,
  palette: Palette,
  "hand-heart": HandHeart,
  "smartphone-off": Smartphone,
};

const statusLabels = {
  thriving: "Thriving",
  steady: "Steady",
  "needs-care": "Needs care",
  priority: "Priority",
  unchecked: "Not checked",
};

function BalanceWheel({ areas }: { areas: LifeBalanceArea[] }) {
  const size = 340;
  const center = size / 2;
  const radius = 132;
  const points = areas.map((area, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / areas.length;
    const scaled = radius * Math.max(area.score, 0.5) / 10;
    return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
  }).join(" ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[370px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full overflow-visible" role="img" aria-label="Life balance wheel">
        {[2, 4, 6, 8, 10].map((level) => {
          const ringPoints = areas.map((_, index) => {
            const angle = -Math.PI / 2 + (index * Math.PI * 2) / areas.length;
            const scaled = radius * level / 10;
            return `${center + Math.cos(angle) * scaled},${center + Math.sin(angle) * scaled}`;
          }).join(" ");
          return <polygon key={level} points={ringPoints} fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-200 dark:text-white/10" />;
        })}
        {areas.map((area, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / areas.length;
          const edgeX = center + Math.cos(angle) * radius;
          const edgeY = center + Math.sin(angle) * radius;
          const labelRadius = radius + 27;
          const labelX = center + Math.cos(angle) * labelRadius;
          const labelY = center + Math.sin(angle) * labelRadius;
          return (
            <g key={area.key}>
              <line x1={center} y1={center} x2={edgeX} y2={edgeY} stroke="currentColor" strokeWidth="1" className="text-slate-200 dark:text-white/10" />
              <circle cx={labelX} cy={labelY} r="4" fill={area.color} />
            </g>
          );
        })}
        <polygon points={points} fill="rgba(99,102,241,0.22)" stroke="rgb(99,102,241)" strokeWidth="3" strokeLinejoin="round" />
        {areas.map((area, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / areas.length;
          const scaled = radius * Math.max(area.score, 0.5) / 10;
          return <circle key={area.key} cx={center + Math.cos(angle) * scaled} cy={center + Math.sin(angle) * scaled} r="4" fill={area.color} stroke="white" strokeWidth="2" />;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="grid h-24 w-24 place-items-center rounded-full border border-white/70 bg-white/90 text-center shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0d1220]/90">
          <div><p className="text-3xl font-black">{areas.filter((area) => area.score > 0).length}</p><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">areas mapped</p></div>
        </div>
      </div>
    </div>
  );
}

export function LifeBalanceShell() {
  const [workspace, setWorkspace] = useState<LifeBalanceWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LifeBalanceArea | null>(null);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [filter, setFilter] = useState<"all" | "attention" | "strong">("all");

  const reload = async () => {
    setError("");
    try { setWorkspace(await getLifeBalanceWorkspace()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load your life balance workspace."); }
    finally { setLoading(false); }
  };

  useEffect(() => { const timer = window.setTimeout(() => void reload(), 0); return () => window.clearTimeout(timer); }, []);

  const visibleAreas = useMemo(() => {
    const areas = workspace?.areas ?? [];
    if (filter === "attention") return areas.filter((area) => area.score > 0 && area.score <= 5);
    if (filter === "strong") return areas.filter((area) => area.score >= 8);
    return areas;
  }, [filter, workspace]);

  const openCheckIn = (area: LifeBalanceArea) => {
    setSelected(area);
    setScore(area.score || 5);
    setNote(area.note ?? "");
    setNextAction(area.next_action ?? area.suggestions[0]);
  };

  const submit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      await saveLifeBalanceCheckIn({ area_key: selected.key, score, note: note.trim() || null, next_action: nextAction.trim() || null });
      setSelected(null);
      await reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save this check-in."); }
    finally { setSaving(false); }
  };

  const removeHistory = async (id: number) => {
    if (!window.confirm("Delete this life balance check-in?")) return;
    setSaving(true);
    try { await deleteLifeBalanceCheckIn(id); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete this check-in."); }
    finally { setSaving(false); }
  };

  const summaryCards = [
    { label: "Overall balance", value: `${workspace?.summary.overall_score ?? 0}%`, Icon: Sparkles },
    { label: "Areas checked", value: `${workspace?.summary.checked_areas ?? 0}/${workspace?.summary.total_areas ?? 15}`, Icon: CheckCircle2 },
    { label: "Need attention", value: workspace?.summary.attention_areas ?? 0, Icon: CircleAlert },
    { label: "Check-in streak", value: `${workspace?.summary.current_streak ?? 0}d`, Icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar insightTitle="Balance, not perfection" insightText="A healthy life is not an equal score everywhere. Notice what is neglected, protect what supports you, and improve one area at a time." insightValue={`${workspace?.summary.overall_score ?? 0}% balance`} />
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[280px]">
        <WorkspaceTopbar eyebrow="Whole-life wellbeing" title="Life Balance" description="See the essential areas of a fulfilling life, check in honestly, and turn weak spots into small realistic actions." />
        <div className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">{error}</div>}
          {loading ? <div className="grid min-h-[480px] place-items-center"><LoaderCircle className="h-9 w-9 animate-spin text-indigo-500" /></div> : <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map(({ label, value, Icon }) => <article key={label} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><Icon className="h-5 w-5 text-indigo-500" /><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <article className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Your whole-life map</p><h2 className="mt-2 text-2xl font-black">Balance wheel</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">The shape matters more than perfection. Deep dips reveal areas that may be quietly affecting everything else.</p></div><button onClick={() => void reload()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10"><RefreshCw className="h-4 w-4" /></button></div>
                <BalanceWheel areas={workspace?.areas ?? []} />
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{(workspace?.areas ?? []).map((area) => <button key={area.key} onClick={() => openCheckIn(area)} className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-bold transition hover:bg-slate-50 dark:hover:bg-white/[0.05]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color }} /><span className="truncate">{area.name}</span><span className="ml-auto text-slate-400">{area.score || "–"}</span></button>)}</div>
              </article>

              <div className="space-y-6">
                <article className="rounded-[30px] border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-violet-50 to-cyan-50 p-6 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-violet-500/5 dark:to-cyan-500/5">
                  <div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-sm dark:bg-white/10"><Sparkles className="h-5 w-5 text-indigo-500" /></span><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Flow Assistant</p><p className="mt-2 text-lg font-black leading-8">{workspace?.assistant_message}</p></div></div>
                  <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.05]"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Weekly balance challenge</p><p className="mt-2 font-bold leading-6">{workspace?.weekly_challenge}</p></div>
                </article>

                <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">How to use this</p><h2 className="mt-2 text-xl font-black">A sustainable weekly rhythm</h2>
                  <div className="mt-5 space-y-4">{[
                    ["1", "Check in honestly", "Score how supported each area feels now, not how successful it looks to others."],
                    ["2", "Choose one weak area", "Trying to repair everything at once usually creates another form of imbalance."],
                    ["3", "Take the smallest useful action", "A phone call, walk, prayer, meal, study block, or tidy space can restart momentum."],
                    ["4", "Review the shape weekly", "Look for neglected areas and trends instead of chasing a perfect total score."],
                  ].map(([step, title, text]) => <div key={step} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">{step}</span><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}</div>
                </article>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Essential life areas</p><h2 className="mt-2 text-2xl font-black">Your foundations</h2><p className="mt-2 text-sm text-slate-500">Each area includes a score, trend, explanation, and an immediate next action.</p></div><div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">{(["all", "attention", "strong"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-black capitalize ${filter === item ? "bg-white shadow-sm dark:bg-white/10" : "text-slate-500"}`}>{item}</button>)}</div></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{visibleAreas.map((area) => {
                const Icon = icons[area.icon] ?? Sparkles;
                return <button key={area.key} onClick={() => openCheckIn(area)} className="group rounded-[24px] border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${area.color}18`, color: area.color }}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-black">{area.name}</h3>{area.trend > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : area.trend < 0 ? <TrendingDown className="h-4 w-4 text-rose-500" /> : null}</div><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{statusLabels[area.status]}</p></div><div className="text-right"><p className="text-2xl font-black" style={{ color: area.color }}>{area.score || "–"}</p><p className="text-[10px] font-bold text-slate-400">/ 10</p></div></div><p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{area.description}</p><div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.04]"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">Next useful action</p><p className="mt-1 text-sm font-bold">{area.next_action}</p></div><div className="mt-4 flex items-center justify-between"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${area.score * 10}%`, backgroundColor: area.color }} /></div><ChevronRight className="ml-3 h-4 w-4 text-slate-300 transition group-hover:translate-x-1" /></div></button>;
              })}</div>
            </section>

            <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-7">
              <div><p className="text-xs font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Reflection history</p><h2 className="mt-2 text-2xl font-black">Recent check-ins</h2></div>
              <div className="mt-5 space-y-3">{workspace?.history.length ? workspace.history.slice(0, 12).map((item) => { const area = workspace.areas.find((entry) => entry.key === item.area_key); return <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: area?.color }} /><div className="min-w-[160px] flex-1"><p className="font-black">{area?.name ?? item.area_key}</p><p className="mt-1 text-xs text-slate-500">{item.checkin_date}{item.note ? ` · ${item.note}` : ""}</p></div><span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black dark:bg-white/[0.06]">{item.score}/10</span><button disabled={saving} onClick={() => void removeHistory(item.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-500 dark:border-rose-500/20"><Trash2 className="h-4 w-4" /></button></div>; }) : <div className="py-12 text-center"><Plus className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-black">No check-ins yet</p><p className="mt-1 text-sm text-slate-500">Open any life area and record how it feels today.</p></div>}</div>
            </section>
          </>}
        </div>
      </motion.main>
      <WorkspaceNavigation variant="mobile" />

      {selected && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19] sm:p-7"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ backgroundColor: `${selected.color}18`, color: selected.color }}>{(() => { const Icon = icons[selected.icon] ?? Sparkles; return <Icon className="h-5 w-5" />; })()}</span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-500">Life balance check-in</p><h2 className="mt-1 text-2xl font-black">{selected.name}</h2></div></div><button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400"><X className="h-5 w-5" /></button></div><p className="mt-5 text-sm leading-6 text-slate-500">{selected.description}</p><div className="mt-6"><div className="flex items-end justify-between"><label className="font-black">How supported does this area feel?</label><span className="text-3xl font-black" style={{ color: selected.color }}>{score}<span className="text-sm text-slate-400">/10</span></span></div><input type="range" min="1" max="10" value={score} onChange={(event) => setScore(Number(event.target.value))} className="mt-4 w-full accent-indigo-600" /><div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"><span>Struggling</span><span>Supported</span></div></div><label className="mt-6 block text-sm font-black">Reflection note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="What is helping or making this area difficult?" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label><label className="mt-5 block text-sm font-black">One small next action<input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Choose something realistic for today or this week" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label><div className="mt-4 flex flex-wrap gap-2">{selected.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setNextAction(suggestion)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{suggestion}</button>)}</div><button disabled={saving} onClick={() => void submit()} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save today’s check-in</button></div></div>}
    </div>
  );
}
