"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Clock3,
  Coins,
  FolderKanban,
  Hash,
  History,
  Lightbulb,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Search,
  Square,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createManualTimeEntry,
  createTimeProject,
  deleteTimeEntry,
  getTimeTrackingWorkspace,
  startTimeTracker,
  stopTimeTracker,
  updateTimeEntry,
} from "@/lib/api";
import type {
  ManualTimeEntryPayload,
  TimeEntry,
  TimeTrackingWorkspace,
} from "@/types/time-tracking";

const projectColors = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#ea580c", "#e11d48"];

function formatDuration(seconds: number, compact = false) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (compact) return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function entrySeconds(entry: TimeEntry, now: number) {
  if (entry.ended_at) return entry.duration_seconds;
  return Math.max(0, Math.floor((now - new Date(entry.started_at).getTime()) / 1000));
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Clock3; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function TimeTrackingShell() {
  const [workspace, setWorkspace] = useState<TimeTrackingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [billable, setBillable] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(projectColors[0]);
  const [manualForm, setManualForm] = useState(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 60000);
    return { description: "", project_id: null as number | null, tags: "", is_billable: false, started_at: toLocalInput(start), ended_at: toLocalInput(end), note: "" };
  });

  const reload = () => {
    setError("");
    return getTimeTrackingWorkspace()
      .then(setWorkspace)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load time tracking."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!workspace?.active_entry) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [workspace?.active_entry]);

  const activeSeconds = workspace?.active_entry ? entrySeconds(workspace.active_entry, now) : 0;
  const maxDaily = Math.max(1, ...(workspace?.daily_totals.map((item) => item.seconds) ?? [1]));
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (workspace?.entries ?? []).filter((entry) => {
      const matchesProject = projectFilter === "all" || (projectFilter === "none" ? entry.project_id === null : entry.project_id === Number(projectFilter));
      const matchesSearch = !query || entry.description.toLowerCase().includes(query) || entry.tags.some((tag) => tag.includes(query)) || entry.project?.name.toLowerCase().includes(query);
      return matchesProject && matchesSearch;
    });
  }, [projectFilter, search, workspace?.entries]);

  const parseTags = (value: string) => value.split(",").map((tag) => tag.trim()).filter(Boolean);

  async function handleTimer() {
    setError("");
    setSaving(true);
    try {
      if (workspace?.active_entry) {
        await stopTimeTracker();
      } else {
        if (!description.trim()) throw new Error("Add a clear activity description before starting.");
        await startTimeTracker({ description: description.trim(), project_id: projectId, tags: parseTags(tagsText), is_billable: billable });
        setDescription("");
        setTagsText("");
      }
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update timer.");
    } finally {
      setSaving(false);
    }
  }

  async function continueEntry(entry: TimeEntry) {
    if (workspace?.active_entry) return;
    setSaving(true);
    setError("");
    try {
      await startTimeTracker({
        description: entry.description,
        project_id: entry.project_id,
        tags: entry.tags,
        is_billable: entry.is_billable,
      });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue time entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSubmit() {
    setSaving(true);
    setError("");
    try {
      const payload: ManualTimeEntryPayload = {
        description: manualForm.description.trim(),
        project_id: manualForm.project_id,
        tags: parseTags(manualForm.tags),
        is_billable: manualForm.is_billable,
        started_at: new Date(manualForm.started_at).toISOString(),
        ended_at: new Date(manualForm.ended_at).toISOString(),
        note: manualForm.note.trim() || null,
      };
      if (!payload.description) throw new Error("Describe the activity you tracked.");
      if (editEntry) await updateTimeEntry(editEntry.id, payload);
      else await createManualTimeEntry(payload);
      setManualOpen(false);
      setEditEntry(null);
      setManualForm((current) => ({ ...current, description: "", tags: "", note: "" }));
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save time entry.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(entry: TimeEntry) {
    setEditEntry(entry);
    setManualForm({
      description: entry.description,
      project_id: entry.project_id,
      tags: entry.tags.join(", "),
      is_billable: entry.is_billable,
      started_at: toLocalInput(new Date(entry.started_at)),
      ended_at: toLocalInput(new Date(entry.ended_at ?? entry.started_at)),
      note: entry.note ?? "",
    });
    setManualOpen(true);
  }

  async function handleCreateProject() {
    if (!projectName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const project = await createTimeProject({ name: projectName.trim(), color: projectColor });
      setProjectId(project.id);
      setProjectName("");
      setProjectOpen(false);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: number) {
    setSaving(true);
    try {
      await deleteTimeEntry(entryId);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle={workspace?.insight.title ?? "Time intelligence"}
        insightText={workspace?.insight.message ?? "Track meaningful activity to reveal where your time actually goes."}
        insightValue={workspace?.active_entry ? "Tracking" : "Ready"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 pb-28 xl:pl-[272px] xl:pb-8">
        <WorkspaceTopbar
          eyebrow="Behaviour intelligence"
          title="Time Tracking"
          description="Capture work as it happens, organize it clearly, and turn time into recommendation-ready evidence."
          actions={
            <button type="button" onClick={() => setManualOpen(true)} className="hidden h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 sm:flex">
              <Plus className="h-4 w-4" /> Manual entry
            </button>
          }
        />

        <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              <span>{error}</span><button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button>
            </div>
          )}

          <section className={`overflow-hidden rounded-[30px] border p-5 shadow-sm sm:p-6 ${workspace?.active_entry ? "border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:border-cyan-400/25 dark:from-indigo-500/[0.12] dark:via-white/[0.04] dark:to-cyan-400/[0.08]" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.035]"}`}>
            {workspace?.active_entry ? (
              <div className="grid items-center gap-5 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live now</span>
                    {workspace.active_entry.project && <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-bold dark:border-white/10 dark:bg-white/[0.05]">{workspace.active_entry.project.name}</span>}
                  </div>
                  <h2 className="mt-4 truncate text-2xl font-black tracking-tight sm:text-3xl">{workspace.active_entry.description}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">{workspace.active_entry.tags.map((tag) => <span key={tag} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">#{tag}</span>)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="min-w-[180px] text-right font-mono text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{formatDuration(activeSeconds)}</p>
                  <button type="button" disabled={saving} onClick={() => void handleTimer()} className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition hover:scale-105 disabled:opacity-60" aria-label="Stop timer"><Square className="h-6 w-6 fill-current" /></button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[minmax(240px,1fr)_220px_minmax(180px,0.7fr)_auto_auto] xl:items-end">
                <label className="min-w-0"><span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">What are you doing?</span><input value={description} onChange={(event) => setDescription(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleTimer(); }} placeholder="e.g. Build scheduling recommendation logic" className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-[#111522]" /></label>
                <label><span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Project</span><div className="mt-2 flex gap-2"><select value={projectId ?? ""} onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : null)} className="h-14 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#111522]"><option value="">Unassigned</option>{workspace?.projects.filter((project) => !project.is_archived).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button type="button" onClick={() => setProjectOpen(true)} className="grid h-14 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/[0.04]"><Plus className="h-5 w-5" /></button></div></label>
                <label><span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Tags</span><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="deep-work, coding" className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
                <label className="flex h-14 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111522]"><input type="checkbox" checked={billable} onChange={(event) => setBillable(event.target.checked)} className="h-4 w-4 rounded accent-indigo-600" /><span className="text-sm font-bold">Billable</span></label>
                <button type="button" disabled={saving} onClick={() => void handleTimer()} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:opacity-60"><Play className="h-5 w-5 fill-current" /> Start timer</button>
              </div>
            )}
          </section>

          {loading ? (
            <div className="grid min-h-[320px] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" /></div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
                <StatCard icon={Clock3} label="Today" value={formatDuration(workspace?.today_seconds ?? 0, true)} detail="Tracked across all activities" />
                <StatCard icon={CalendarClock} label="This week" value={formatDuration(workspace?.week_seconds ?? 0, true)} detail={`${workspace?.entries_this_week ?? 0} saved entries`} />
                <StatCard icon={Coins} label="Billable" value={formatDuration(workspace?.billable_week_seconds ?? 0, true)} detail="Marked billable this week" />
                <StatCard icon={TrendingUp} label="Daily average" value={formatDuration(workspace?.average_daily_seconds ?? 0, true)} detail="Across active tracked days" />
                <StatCard icon={FolderKanban} label="Projects" value={`${workspace?.projects.filter((project) => !project.is_archived).length ?? 0}`} detail="Reusable activity groups" />
              </section>

              <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Weekly rhythm</p><h2 className="mt-1 text-2xl font-black tracking-tight">When your time was invested</h2></div><BarChart3 className="h-5 w-5 text-slate-400" /></div>
                  <div className="mt-7 grid h-52 grid-cols-7 items-end gap-2 sm:gap-4">{workspace?.daily_totals.map((item) => { const height = Math.max(8, item.seconds / maxDaily * 100); return <div key={item.date} className="flex h-full flex-col justify-end gap-2"><div className="relative flex flex-1 items-end overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/[0.04]"><motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} className="w-full rounded-2xl bg-gradient-to-t from-indigo-600 to-cyan-400" title={formatDuration(item.seconds, true)} /></div><p className="text-center text-[10px] font-black uppercase text-slate-400">{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</p></div>; })}</div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                  <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Lightbulb className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-300">Flow Assistant</p><h2 className="mt-1 text-xl font-black">{workspace?.insight.title}</h2></div></div>
                  <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace?.insight.message}</p>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.025]"><p className="text-xs font-black uppercase tracking-[0.13em] text-slate-400">Recommended next step</p><p className="mt-2 text-sm font-semibold leading-6">{workspace?.insight.recommendation}</p></div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-300">Project allocation</p><h2 className="mt-1 text-xl font-black">Where your week went</h2></div><BriefcaseBusiness className="h-5 w-5 text-slate-400" /></div><div className="mt-6 space-y-4">{workspace?.project_breakdown.length ? workspace.project_breakdown.slice(0, 6).map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 font-bold"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color ?? "#94a3b8" }} /><span className="truncate">{item.label}</span></span><span className="shrink-0 text-slate-500">{formatDuration(item.seconds, true)} · {item.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.05]"><div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color ?? "#94a3b8" }} /></div></div>) : <p className="py-12 text-center text-sm text-slate-400">Project allocation appears after you track time.</p>}</div></div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-300">Tag intelligence</p><h2 className="mt-1 text-xl font-black">Activity themes</h2></div><Hash className="h-5 w-5 text-slate-400" /></div><div className="mt-6 flex flex-wrap gap-3">{workspace?.tag_breakdown.length ? workspace.tag_breakdown.slice(0, 12).map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"><p className="text-sm font-black">#{item.label}</p><p className="mt-1 text-xs text-slate-500">{formatDuration(item.seconds, true)} · {item.percentage}%</p></div>) : <p className="w-full py-12 text-center text-sm text-slate-400">Use tags such as deep-work, meetings, study, exercise, or recovery.</p>}</div></div>
              </section>

              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-white/10 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Detailed timeline</p><h2 className="mt-1 text-2xl font-black">Time entries</h2></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity or tag" className="h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none dark:border-white/10 dark:bg-[#111522]" /></label><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-[#111522]"><option value="all">All projects</option><option value="none">Unassigned</option>{workspace?.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button type="button" onClick={() => setManualOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /> Add</button></div></div>
                <div className="divide-y divide-slate-200 dark:divide-white/10">{filteredEntries.length ? filteredEntries.map((entry) => <div key={entry.id} className="group grid gap-4 p-5 transition hover:bg-slate-50 dark:hover:bg-white/[0.02] sm:p-6 lg:grid-cols-[minmax(0,1fr)_180px_140px_auto] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black">{entry.description}</p>{entry.is_billable && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Billable</span>}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/[0.06]">{entry.source}</span></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">{entry.project && <span className="flex items-center gap-1.5 font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.project.color }} />{entry.project.name}</span>}{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div><div className="text-sm"><p className="font-bold">{new Date(entry.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p><p className="mt-1 text-xs text-slate-500">{new Date(entry.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {entry.ended_at ? new Date(entry.ended_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Running"}</p></div><p className="font-mono text-lg font-black tabular-nums">{formatDuration(entrySeconds(entry, now), true)}</p><div className="flex justify-end gap-2"><button type="button" disabled={!entry.ended_at || saving || !!workspace?.active_entry} onClick={() => void continueEntry(entry)} aria-label={`Continue ${entry.description}`} title="Continue this entry" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 dark:border-white/10"><Play className="h-4 w-4" /></button><button type="button" disabled={!entry.ended_at} onClick={() => openEdit(entry)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-indigo-600 disabled:opacity-30 dark:border-white/10"><Pencil className="h-4 w-4" /></button><button type="button" disabled={!entry.ended_at || saving} onClick={() => void handleDelete(entry.id)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-30 dark:border-white/10"><Trash2 className="h-4 w-4" /></button></div></div>) : <div className="grid min-h-[220px] place-items-center p-8 text-center"><div><History className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-black">No matching entries</p><p className="mt-1 text-sm text-slate-500">Start the timer or add time manually.</p></div></div>}</div>
              </section>
            </>
          )}
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />

      {(manualOpen || projectOpen) && <button type="button" aria-label="Close dialog" onClick={() => { setManualOpen(false); setProjectOpen(false); setEditEntry(null); }} className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />}

      {manualOpen && (
        <div className="fixed inset-x-3 top-1/2 z-[90] mx-auto workspace-modal-scroll max-h-[90dvh] max-w-2xl -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19] sm:p-6">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">{editEntry ? "Edit record" : "Manual mode"}</p><h2 className="mt-1 text-2xl font-black">{editEntry ? "Update time entry" : "Add tracked time"}</h2></div><button type="button" onClick={() => { setManualOpen(false); setEditEntry(null); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="text-sm font-bold">Activity</span><input value={manualForm.description} onChange={(event) => setManualForm({ ...manualForm, description: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
            <label><span className="text-sm font-bold">Start</span><input type="datetime-local" value={manualForm.started_at} onChange={(event) => setManualForm({ ...manualForm, started_at: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
            <label><span className="text-sm font-bold">End</span><input type="datetime-local" value={manualForm.ended_at} onChange={(event) => setManualForm({ ...manualForm, ended_at: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
            <label><span className="text-sm font-bold">Project</span><select value={manualForm.project_id ?? ""} onChange={(event) => setManualForm({ ...manualForm, project_id: event.target.value ? Number(event.target.value) : null })} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]"><option value="">Unassigned</option>{workspace?.projects.filter((project) => !project.is_archived).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <label><span className="text-sm font-bold">Tags</span><input value={manualForm.tags} onChange={(event) => setManualForm({ ...manualForm, tags: event.target.value })} placeholder="study, deep-work" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
            <label className="sm:col-span-2"><span className="text-sm font-bold">Note</span><textarea value={manualForm.note} onChange={(event) => setManualForm({ ...manualForm, note: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={manualForm.is_billable} onChange={(event) => setManualForm({ ...manualForm, is_billable: event.target.checked })} className="h-4 w-4 accent-indigo-600" /><span className="text-sm font-bold">Mark as billable</span></label>
          </div>
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setManualOpen(false); setEditEntry(null); }} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-white/10">Cancel</button><button type="button" disabled={saving} onClick={() => void handleManualSubmit()} className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save entry</button></div>
        </div>
      )}

      {projectOpen && (
        <div className="fixed inset-x-3 top-1/2 z-[90] mx-auto max-w-md -translate-y-1/2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Organization</p><h2 className="mt-1 text-2xl font-black">New project</h2></div><button type="button" onClick={() => setProjectOpen(false)}><X className="h-5 w-5 text-slate-400" /></button></div>
          <label className="mt-6 block"><span className="text-sm font-bold">Project name</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="FlowMind development" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label>
          <div className="mt-5"><p className="text-sm font-bold">Color</p><div className="mt-3 flex flex-wrap gap-3">{projectColors.map((color) => <button key={color} type="button" onClick={() => setProjectColor(color)} className={`grid h-10 w-10 place-items-center rounded-xl transition ${projectColor === color ? "ring-4 ring-indigo-500/20" : ""}`} style={{ backgroundColor: color }}>{projectColor === color && <Check className="h-5 w-5 text-white" />}</button>)}</div></div>
          <button type="button" disabled={saving || !projectName.trim()} onClick={() => void handleCreateProject()} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /> Create project</button>
        </div>
      )}
    </div>
  );
}
