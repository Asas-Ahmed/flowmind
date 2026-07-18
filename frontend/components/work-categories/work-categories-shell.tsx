"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  BriefcaseBusiness,
  Check,
  Clock3,
  Code2,
  Dumbbell,
  FolderTree,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createWorkCategory,
  deleteWorkCategory,
  getTimeTrackingWorkspace,
  updateTimeProject,
  updateWorkCategory,
} from "@/lib/api";
import type { TimeProject, TimeTrackingWorkspace, WorkCategory } from "@/types/time-tracking";

const colors = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#ea580c", "#e11d48"];
const categoryIcons = [
  { value: "code", label: "Development", Icon: Code2 },
  { value: "study", label: "Study", Icon: GraduationCap },
  { value: "reading", label: "Reading", Icon: BookOpen },
  { value: "meetings", label: "Meetings", Icon: Users },
  { value: "exercise", label: "Exercise", Icon: Dumbbell },
  { value: "briefcase", label: "General", Icon: BriefcaseBusiness },
];

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function iconFor(value: string) {
  return categoryIcons.find((item) => item.value === value)?.Icon ?? BriefcaseBusiness;
}

export function WorkCategoriesShell() {
  const [workspace, setWorkspace] = useState<TimeTrackingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkCategory | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [icon, setIcon] = useState("briefcase");
  const [targetHours, setTargetHours] = useState("");

  const reload = () =>
    getTimeTrackingWorkspace()
      .then(setWorkspace)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load work categories."))
      .finally(() => setLoading(false));

  useEffect(() => {
    const id = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(id);
  }, []);

  const activeCategories = useMemo(
    () => (workspace?.categories ?? []).filter((category) => !category.is_archived),
    [workspace?.categories],
  );
  const uncategorized = workspace?.category_breakdown.find((item) => item.category_id === null)?.seconds ?? 0;
  const topCategory = workspace?.category_breakdown.find((item) => item.category_id !== null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setColor(colors[0]);
    setIcon("briefcase");
    setTargetHours("");
    setDialogOpen(true);
  };

  const openEdit = (category: WorkCategory) => {
    setEditing(category);
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
    setTargetHours(category.weekly_target_minutes ? String(category.weekly_target_minutes / 60) : "");
    setDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const weeklyTarget = targetHours ? Math.max(0.5, Number(targetHours)) * 60 : null;
    try {
      if (editing) {
        await updateWorkCategory(editing.id, {
          name: name.trim(),
          color,
          icon,
          weekly_target_minutes: weeklyTarget,
        });
      } else {
        await createWorkCategory({
          name: name.trim(),
          color,
          icon,
          weekly_target_minutes: weeklyTarget,
        });
      }
      setDialogOpen(false);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const assignProject = async (project: TimeProject, categoryId: number | null) => {
    setSaving(true);
    setError("");
    try {
      await updateTimeProject(project.id, { category_id: categoryId });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update project category.");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category: WorkCategory) => {
    const confirmed = window.confirm(
      `Delete "${category.name}" permanently? Projects assigned to it will become uncategorized.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      await deleteWorkCategory(category.id);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050711] dark:text-white">
      <WorkspaceSidebar
        insightTitle="Time allocation"
        insightText={topCategory ? `${topCategory.label} currently receives the largest share of your tracked week.` : "Create categories to understand where your time is going."}
        insightValue={topCategory ? `${topCategory.percentage}%` : "Ready"}
      />

      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 xl:pl-[272px]">
        <WorkspaceTopbar
          eyebrow="Time intelligence"
          title="Work Categories"
          description="Group projects into meaningful areas and compare your weekly time investment against intentional targets."
        />

        <div className="mx-auto max-w-[1500px] space-y-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 xl:pb-10">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</div>}

          {loading ? (
            <div className="grid min-h-[420px] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" /></div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><FolderTree className="h-5 w-5 text-indigo-500" /><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Active categories</p><p className="mt-2 text-3xl font-black">{activeCategories.length}</p></div>
                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><Clock3 className="h-5 w-5 text-cyan-500" /><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Categorized this week</p><p className="mt-2 text-3xl font-black">{formatTime(Math.max(0, (workspace?.week_seconds ?? 0) - uncategorized))}</p></div>
                <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><Sparkles className="h-5 w-5 text-violet-500" /><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Leading category</p><p className="mt-2 truncate text-2xl font-black">{topCategory?.label ?? "No data yet"}</p></div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Weekly distribution</p><h2 className="mt-1 text-2xl font-black">Where your time went</h2></div><button type="button" onClick={openCreate} className="flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /> New category</button></div>
                <div className="mt-6 space-y-5">
                  {workspace?.category_breakdown.length ? workspace.category_breakdown.map((item) => {
                    const targetProgress = item.target_seconds ? Math.min(100, Math.round(item.seconds / item.target_seconds * 100)) : null;
                    return <div key={`${item.category_id}-${item.label}`}><div className="flex items-end justify-between gap-4"><div><p className="font-black">{item.label}</p><p className="mt-1 text-xs text-slate-500">{formatTime(item.seconds)} · {item.percentage}% of tracked time</p></div><p className="text-sm font-bold">{targetProgress === null ? "No target" : `${targetProgress}% target`}</p></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${Math.max(2, item.percentage)}%`, backgroundColor: item.color ?? "#94a3b8" }} /></div></div>;
                  }) : <div className="py-12 text-center"><Target className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-black">No categorized time yet</p><p className="mt-1 text-sm text-slate-500">Create categories, assign projects, and continue tracking normally.</p></div>}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                  <h2 className="text-xl font-black">Category library</h2><p className="mt-1 text-sm text-slate-500">Reusable areas for work, study, wellbeing, and personal time.</p>
                  <div className="mt-5 space-y-3">{activeCategories.map((category) => { const Icon = iconFor(category.icon); return <div key={category.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ backgroundColor: category.color }}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-black">{category.name}</p><p className="mt-1 text-xs text-slate-500">{category.weekly_target_minutes ? `${category.weekly_target_minutes / 60}h weekly target` : "No weekly target"}</p></div><button type="button" onClick={() => openEdit(category)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10"><Pencil className="h-4 w-4" /></button><button type="button" disabled={saving} onClick={() => void removeCategory(category)} aria-label={`Delete ${category.name}`} title="Delete category" className="grid h-9 w-9 place-items-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div>; })}</div>
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6">
                  <h2 className="text-xl font-black">Project classification</h2><p className="mt-1 text-sm text-slate-500">A project inherits one work category, keeping every tracked entry consistent.</p>
                  <div className="mt-5 divide-y divide-slate-200 dark:divide-white/10">{workspace?.projects.filter((project) => !project.is_archived).map((project) => <div key={project.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center"><div className="flex min-w-0 items-center gap-3"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} /><div className="min-w-0"><p className="truncate font-black">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.category?.name ?? "Uncategorized"}</p></div></div><select disabled={saving} value={project.category_id ?? ""} onChange={(event) => void assignProject(project, event.target.value ? Number(event.target.value) : null)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none dark:border-white/10 dark:bg-[#111522]"><option value="">Uncategorized</option>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>)}</div>
                </section>
              </div>
            </>
          )}
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />

      {dialogOpen && <button type="button" aria-label="Close dialog" onClick={() => setDialogOpen(false)} className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />}
      {dialogOpen && <div className="fixed inset-x-3 top-1/2 z-[90] mx-auto max-w-lg -translate-y-1/2 rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-cyan-300">Classification</p><h2 className="mt-1 text-2xl font-black">{editing ? "Edit category" : "New work category"}</h2></div><button type="button" onClick={() => setDialogOpen(false)}><X className="h-5 w-5 text-slate-400" /></button></div><div className="mt-6 space-y-4"><label className="block"><span className="text-sm font-bold">Category name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Development" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label><label className="block"><span className="text-sm font-bold">Weekly target hours</span><input type="number" min="0.5" step="0.5" value={targetHours} onChange={(event) => setTargetHours(event.target.value)} placeholder="20" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none dark:border-white/10 dark:bg-[#111522]" /></label><div><p className="text-sm font-bold">Icon</p><div className="mt-3 grid grid-cols-3 gap-2">{categoryIcons.map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => setIcon(value)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-bold ${icon === value ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200" : "border-slate-200 dark:border-white/10"}`}><Icon className="h-4 w-4" />{label}</button>)}</div></div><div><p className="text-sm font-bold">Color</p><div className="mt-3 flex gap-3">{colors.map((item) => <button key={item} type="button" onClick={() => setColor(item)} className={`grid h-10 w-10 place-items-center rounded-xl ${color === item ? "ring-4 ring-indigo-500/20" : ""}`} style={{ backgroundColor: item }}>{color === item && <Check className="h-5 w-5 text-white" />}</button>)}</div></div></div><button type="button" disabled={saving || !name.trim()} onClick={() => void saveCategory()} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save category</button></div>}
    </div>
  );
}
