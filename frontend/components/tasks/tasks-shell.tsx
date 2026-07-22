"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  Archive,
  BarChart3,
  BrainCircuit,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  Download,
  Filter,
  FolderPlus,
  Grid2X2,
  List,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createTask,
  createTaskCategory,
  createTaskList,
  deleteTask,
  deleteTaskCategory,
  deleteTaskList,
  getTaskWorkspace,
  getTaskRiskWorkspace,
  updateTask,
} from "@/lib/api";
import type {
  EisenhowerPriority,
  EnergyLevel,
  RepeatRule,
  Subtask,
  Task,
  TaskCategory,
  TaskList,
  TaskPayload,
  TaskStatus,
} from "@/types/task";
import type { TaskRiskPrediction } from "@/types/task-risk";

type ViewMode = "list" | "board" | "matrix" | "calendar" | "analytics";
type SortMode = "due" | "created" | "title" | "status" | "priority";

const blankTask = (): TaskPayload => ({
  title: "",
  description: null,
  list_id: null,
  category_id: null,
  status: "not_started",
  eisenhower: "important_not_urgent",
  energy_level: "medium",
  start_at: null,
  due_at: null,
  is_all_day: false,
  repeat_rule: "none",
  repeat_interval: 1,
  repeat_until: null,
  reminder_enabled: false,
  reminder_at: null,
  tags: [],
  subtasks: [],
});

const statusLabels: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  waiting: "Waiting",
  completed: "Completed",
};

const priorityMeta: Record<
  EisenhowerPriority,
  { label: string; subtitle: string; className: string; order: number }
> = {
  urgent_important: {
    label: "Do first",
    subtitle: "Urgent + important",
    className: "border-rose-300 bg-rose-500/8 dark:border-rose-400/25",
    order: 0,
  },
  important_not_urgent: {
    label: "Schedule",
    subtitle: "Important, not urgent",
    className: "border-amber-300 bg-amber-500/8 dark:border-amber-400/25",
    order: 1,
  },
  urgent_not_important: {
    label: "Delegate",
    subtitle: "Urgent, less important",
    className: "border-sky-300 bg-sky-500/8 dark:border-sky-400/25",
    order: 2,
  },
  not_urgent_not_important: {
    label: "Eliminate",
    subtitle: "Low value",
    className: "border-slate-300 bg-slate-500/8 dark:border-white/10",
    order: 3,
  },
};

const viewButtons: Array<{ value: ViewMode; label: string; icon: typeof List }> = [
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: Grid2X2 },
  { value: "matrix", label: "Matrix", icon: BrainCircuit },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
];

function toInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toApiDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function taskProgress(task: Task) {
  if (!task.subtasks.length) return task.status === "completed" ? 100 : 0;
  return Math.round((task.subtasks.filter((item) => item.completed).length / task.subtasks.length) * 100);
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TasksShell() {
  const importRef = useRef<HTMLInputElement>(null);
  const favoritesLoadedRef = useRef(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskRisks, setTaskRisks] = useState<Record<number, TaskRiskPrediction>>({});
  const [lists, setLists] = useState<TaskList[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [listFilter, setListFilter] = useState<number | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("due");
  const [showCompleted, setShowCompleted] = useState(true);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [month, setMonth] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskPayload>(blankTask());
  const [tagsText, setTagsText] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [organizerOpen, setOrganizerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = window.localStorage.getItem("flowmind_task_favorites");

    queueMicrotask(() => {
      if (cancelled) return;

      if (stored) {
        try {
          const parsed = JSON.parse(stored) as unknown;
          if (Array.isArray(parsed) && parsed.every((value) => typeof value === "number")) {
            setFavoriteIds(parsed);
          }
        } catch {
          window.localStorage.removeItem("flowmind_task_favorites");
        }
      }

      favoritesLoadedRef.current = true;
    });

    Promise.all([getTaskWorkspace(), getTaskRiskWorkspace()])
      .then(([data, riskData]) => {
        if (cancelled) return;
        setTasks(data.tasks);
        setLists(data.lists);
        setCategories(data.categories);
        setTaskRisks(Object.fromEntries(riskData.predictions.map((prediction) => [prediction.task_id, prediction])));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load tasks");
      })

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!favoritesLoadedRef.current) return;
    window.localStorage.setItem("flowmind_task_favorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);



  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const priorityRank = (task: Task) => priorityMeta[task.eisenhower].order;
    const statusRank: Record<TaskStatus, number> = { in_progress: 0, waiting: 1, not_started: 2, completed: 3 };

    return tasks
      .filter((task) => {
        const matchesSearch =
          !query ||
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        const matchesList = listFilter === "all" || task.list_id === listFilter;
        const matchesCompleted = showCompleted || task.status !== "completed";
        const matchesFavorite = !favoritesOnly || favoriteIds.includes(task.id);
        return matchesSearch && matchesStatus && matchesList && matchesCompleted && matchesFavorite;
      })
      .sort((a, b) => {
        if (sortMode === "title") return a.title.localeCompare(b.title);
        if (sortMode === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortMode === "status") return statusRank[a.status] - statusRank[b.status];
        if (sortMode === "priority") return priorityRank(a) - priorityRank(b);
        const aDue = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });
  }, [tasks, search, statusFilter, listFilter, showCompleted, favoritesOnly, favoriteIds, sortMode]);

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const completedToday = tasks.filter((task) => task.completed_at && sameDay(new Date(task.completed_at), now)).length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const overdue = tasks.filter((task) => task.due_at && new Date(task.due_at) < now && task.status !== "completed").length;
    const dueToday = tasks.filter((task) => task.due_at && sameDay(new Date(task.due_at), now) && task.status !== "completed").length;
    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startToday);
      date.setDate(startToday.getDate() - (6 - index));
      return {
        label: date.toLocaleDateString([], { weekday: "short" }),
        count: tasks.filter((task) => task.completed_at && sameDay(new Date(task.completed_at), date)).length,
      };
    });
    return { total: tasks.length, completed, completedToday, completionRate, overdue, dueToday, lastSevenDays };
  }, [tasks]);

  const suggestions = useMemo(() => {
    const now = new Date();
    const open = tasks.filter((task) => task.status !== "completed");
    const result: string[] = [];
    const overdue = open.filter((task) => task.due_at && new Date(task.due_at) < now);
    const doFirst = open.filter((task) => task.eisenhower === "urgent_important");
    const unplanned = open.filter((task) => !task.due_at);
    if (overdue.length) result.push(`Clear ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"} before adding more work.`);
    if (doFirst.length) result.push(`Start with “${doFirst[0].title}” because it is marked Do First.`);
    if (unplanned.length) result.push(`Schedule ${unplanned.length} task${unplanned.length === 1 ? "" : "s"} without due dates.`);
    if (!result.length && open.length) result.push(`Your workload looks controlled. Continue with “${open[0].title}”.`);
    if (!open.length) result.push("Everything is complete. Add tomorrow’s most important task when ready.");
    return result.slice(0, 3);
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const openCreate = (date?: Date) => {
    const next = blankTask();
    next.list_id = lists[0]?.id ?? null;
    if (date) {
      const selected = new Date(date);
      selected.setHours(9, 0, 0, 0);
      next.due_at = selected.toISOString();
    }
    setEditing(null);
    setForm(next);
    setTagsText("");
    setSubtaskText("");
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      list_id: task.list_id,
      category_id: task.category_id,
      status: task.status,
      eisenhower: task.eisenhower,
      energy_level: task.energy_level,
      start_at: task.start_at,
      due_at: task.due_at,
      is_all_day: task.is_all_day,
      repeat_rule: task.repeat_rule,
      repeat_interval: task.repeat_interval,
      repeat_until: task.repeat_until,
      reminder_enabled: task.reminder_enabled,
      reminder_at: task.reminder_at,
      tags: task.tags,
      subtasks: task.subtasks,
    });
    setTagsText(task.tags.join(", "));
    setSubtaskText("");
    setModalOpen(true);
  };

  const saveTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (form.reminder_enabled && !form.reminder_at) {
      setError("Choose a reminder time or disable the reminder.");
      return;
    }
    setSaving(true);
    setError("");
    const payload: TaskPayload = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      tags: tagsText.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean),
    };
    try {
      if (editing) {
        const updated = await updateTask(editing.id, payload);
        setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      } else {
        const created = await createTask(payload);
        setTasks((current) => [created, ...current]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save task");
    } finally {
      setSaving(false);
    }
  };

  const patchTask = async (taskId: number, payload: Partial<TaskPayload>) => {
    try {
      const updated = await updateTask(taskId, payload);
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    }
  };

  const removeTask = async (taskId: number) => {
    if (!window.confirm("Delete this task permanently?")) return;
    try {
      await deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      setFavoriteIds((current) => current.filter((id) => id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task");
    }
  };

  const duplicateTask = async (task: Task) => {
    const payload: TaskPayload = {
      title: `${task.title} (copy)`,
      description: task.description,
      list_id: task.list_id,
      category_id: task.category_id,
      status: "not_started",
      eisenhower: task.eisenhower,
      energy_level: task.energy_level,
      start_at: task.start_at,
      due_at: task.due_at,
      is_all_day: task.is_all_day,
      repeat_rule: task.repeat_rule,
      repeat_interval: task.repeat_interval,
      repeat_until: task.repeat_until,
      reminder_enabled: false,
      reminder_at: null,
      tags: [...task.tags],
      subtasks: task.subtasks.map((item) => ({ ...item, id: crypto.randomUUID(), completed: false })),
    };
    try {
      const created = await createTask(payload);
      setTasks((current) => [created, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to duplicate task");
    }
  };

  const addList = async () => {
    if (!newListName.trim()) return;
    try {
      const created = await createTaskList(newListName.trim(), "#4a6ded");
      setLists((current) => [...current, created]);
      setNewListName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create list");
    }
  };

  const removeList = async (listId: number) => {
    if (!window.confirm("Delete this list? Its tasks will become unassigned.")) return;
    try {
      await deleteTaskList(listId);
      setLists((current) => current.filter((item) => item.id !== listId));
      setTasks((current) => current.map((task) => (task.list_id === listId ? { ...task, list_id: null } : task)));
      if (listFilter === listId) setListFilter("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete list");
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createTaskCategory(newCategoryName.trim(), "#762bbc");
      setCategories((current) => [...current, created]);
      setNewCategoryName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create category");
    }
  };

  const removeCategory = async (categoryId: number) => {
    if (!window.confirm("Delete this category? Its tasks will become uncategorized.")) return;
    try {
      await deleteTaskCategory(categoryId);
      setCategories((current) => current.filter((item) => item.id !== categoryId));
      setTasks((current) => current.map((task) => (task.category_id === categoryId ? { ...task, category_id: null } : task)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete category");
    }
  };

  const importTasks = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { tasks?: Task[] } | Task[];
      const source = Array.isArray(parsed) ? parsed : parsed.tasks ?? [];
      const created: Task[] = [];
      for (const task of source.slice(0, 100)) {
        created.push(
          await createTask({
            title: task.title,
            description: task.description ?? null,
            list_id: lists.some((item) => item.id === task.list_id) ? task.list_id : lists[0]?.id ?? null,
            category_id: categories.some((item) => item.id === task.category_id) ? task.category_id : null,
            status: task.status ?? "not_started",
            eisenhower: task.eisenhower ?? "important_not_urgent",
            energy_level: task.energy_level ?? "medium",
            start_at: task.start_at ?? null,
            due_at: task.due_at ?? null,
            is_all_day: task.is_all_day ?? false,
            repeat_rule: task.repeat_rule ?? "none",
            repeat_interval: task.repeat_interval ?? 1,
            repeat_until: task.repeat_until ?? null,
            reminder_enabled: false,
            reminder_at: null,
            tags: task.tags ?? [],
            subtasks: (task.subtasks ?? []).map((item) => ({ ...item, id: crypto.randomUUID() })),
          }),
        );
      }
      setTasks((current) => [...created, ...current]);
    } catch {
      setError("Import failed. Choose a valid FlowMind task JSON file.");
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ 
        duration: 0.22, 
        ease: "easeOut", 
        }} 
        className="relative min-h-screen overflow-x-hidden bg-[#f5f7fb] text-slate-950 dark:bg-[#050713] dark:text-slate-50"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,109,237,0.13),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(207,77,225,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,242,253,0.08),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(189,67,254,0.10),transparent_30%)]" />

        <WorkspaceSidebar
          taskCount={tasks.length}
          insightTitle="Task momentum"
          insightText={
            stats.overdue > 0
              ? `${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"} need attention.`
              : "Your task workspace is clear and ready for focused progress."
          }
        />

        <div className="relative min-h-screen xl:pl-[272px]">

        <section className="min-w-0">
          <WorkspaceTopbar
            eyebrow="Task workspace"
            title="Organize what matters."
            description="Plan, prioritize, schedule, and complete your work."
            centerContent={
              <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.055] dark:focus-within:border-indigo-400/40">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks, notes or tags..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
            }
            actions={null}
          />

          <div className="mx-auto max-w-[1560px] space-y-6 px-4 py-6 pb-28 sm:px-6 lg:px-8 xl:pb-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] sm:p-7">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200"><BrainCircuit className="h-3.5 w-3.5" /> Smart planning workspace</div><h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Turn your priorities into focused progress.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Organize work across lists, statuses, the Eisenhower Matrix and calendar without losing sight of what matters next.</p></div>
                <div className="flex flex-wrap gap-2"><button onClick={() => downloadJson("flowmind-tasks.json", { exported_at: new Date().toISOString(), tasks })} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"><Download className="h-4 w-4" /> Export</button><button onClick={() => importRef.current?.click()} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"><Upload className="h-4 w-4" /> Import</button><input ref={importRef} type="file" accept="application/json" onChange={(event) => void importTasks(event)} className="hidden" /><button onClick={() => openCreate()} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"><Plus className="h-5 w-5" /> New task</button></div>
              </div>
            </section>

            {error && <div className="flex items-center justify-between rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"><span>{error}</span><button onClick={() => setError("")} className="rounded-lg p-1 hover:bg-rose-500/10"><X className="h-4 w-4" /></button></div>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {(
                [
                  {
                    label: "All tasks",
                    value: stats.total,
                    icon: ListTodo,
                    helper: "Total workload",
                    gradient: "from-indigo-500 to-blue-500",
                  },
                  {
                    label: "Due today",
                    value: stats.dueToday,
                    icon: CalendarDays,
                    helper: "Needs attention",
                    gradient: "from-cyan-500 to-blue-500",
                  },
                  {
                    label: "Overdue",
                    value: stats.overdue,
                    icon: Clock3,
                    helper: "Past deadline",
                    gradient: "from-rose-500 to-orange-500",
                  },
                  {
                    label: "Completed",
                    value: stats.completedToday,
                    icon: CheckCircle2,
                    helper: "Finished today",
                    gradient: "from-emerald-500 to-teal-500",
                  },
                  {
                    label: "Completion",
                    value: `${stats.completionRate}%`,
                    icon: BarChart3,
                    helper: `${stats.completed} of ${stats.total} tasks`,
                    gradient: "from-violet-500 to-fuchsia-500",
                  },
                ] satisfies Array<{
                  label: string;
                  value: string | number;
                  icon: React.ComponentType<{ className?: string }>;
                  helper: string;
                  gradient: string;
                }>
              ).map(({ label, value, icon: Icon, helper, gradient }) => (
                <article
                  key={label}
                  className="group rounded-[1.6rem] border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.045]"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    <span className="text-xs text-slate-400">{helper}</span>
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {label}
                  </p>

                  <p className="mt-1 text-3xl font-black tracking-tight">
                    {value}
                  </p>
                </article>
              ))}
            </section>

            <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setListFilter("all")}
                    className={`flex min-w-fit items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                      listFilter === "all"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <ListTodo className="h-4 w-4" />
                    All tasks
                    <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{tasks.length}</span>
                  </button>

                  {lists.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setListFilter(item.id)}
                      className={`flex min-w-fit items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                        listFilter === item.id
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      {item.name}
                      <span className="text-[10px] text-slate-400">
                        {tasks.filter((task) => task.list_id === item.id).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFavoritesOnly((value) => !value)}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                      favoritesOnly
                        ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                  >
                    <Star className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
                    Favorites
                  </button>
                  <button
                    onClick={() => setShowCompleted((value) => !value)}
                    className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Archive className="h-4 w-4" />
                    {showCompleted ? "Hide completed" : "Show completed"}
                  </button>
                  <button
                    onClick={() => setOrganizerOpen((value) => !value)}
                    className="flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Manage
                  </button>
                </div>
              </div>

              {organizerOpen && (
                <div className="mt-3 grid gap-3 border-t border-slate-200/70 pt-3 dark:border-white/10 lg:grid-cols-2">
                  <section className="rounded-[1.4rem] bg-slate-50/90 p-4 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-cyan-300">Collections</p>
                        <h3 className="mt-1 font-black">Manage task lists</h3>
                      </div>
                      <FolderPlus className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="mt-4 space-y-2">
                      {lists.map((item) => (
                        <div key={item.id} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#0b1022]">
                          <span className="h-3 w-3 rounded-full ring-4 ring-slate-100 dark:ring-white/5" style={{ background: item.color }} />
                          <button onClick={() => setListFilter(item.id)} className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
                            {item.name}
                          </button>
                          <span className="text-xs text-slate-400">{tasks.filter((task) => task.list_id === item.id).length}</span>
                          {!item.is_default && (
                            <button
                              onClick={() => void removeList(item.id)}
                              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={newListName}
                        onChange={(event) => setNewListName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void addList();
                        }}
                        placeholder="Create a new list"
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-[#0b1022]"
                      />
                      <button onClick={() => void addList()} className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-500">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[1.4rem] bg-slate-50/90 p-4 dark:bg-white/[0.035]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-fuchsia-300">Organization</p>
                        <h3 className="mt-1 font-black">Manage categories</h3>
                      </div>
                      <Tag className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="mt-4 flex min-h-12 flex-wrap content-start gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-white/10 dark:bg-[#0b1022]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: category.color }} />
                          <span>{category.name}</span>
                          <button onClick={() => void removeCategory(category.id)} className="text-slate-400 transition hover:text-rose-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {!categories.length && <p className="text-sm text-slate-400">No categories yet.</p>}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void addCategory();
                        }}
                        placeholder="Create a new category"
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-[#0b1022]"
                      />
                      <button onClick={() => void addCategory()} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white transition hover:bg-violet-500">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </section>

            <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 space-y-5">
                <div className="flex flex-col gap-3 rounded-[1.7rem] border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.045] lg:flex-row lg:items-center">
                  <div className="flex flex-1 gap-2 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-white/5">{viewButtons.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setView(value)} className={`flex min-w-fit items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${view === value ? "bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
                  <div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-[#0b1022]"><Filter className="h-4 w-4 text-slate-400" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)} className="task-select bg-transparent py-2.5 text-sm outline-none"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="task-select rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-[#0b1022]"><option value="due">Due date</option><option value="priority">Priority</option><option value="status">Status</option><option value="created">Newest</option><option value="title">Title</option></select></div>
                </div>

                {view === "list" && <div className="space-y-3">{filteredTasks.map((task) => <TaskCard key={task.id} task={task} risk={taskRisks[task.id]} favorite={favoriteIds.includes(task.id)} lists={lists} categories={categories} onEdit={openEdit} onDelete={removeTask} onDuplicate={duplicateTask} onFavorite={(id) => setFavoriteIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} onStatus={(status) => void patchTask(task.id, { status })} />)}{!filteredTasks.length && <EmptyState onAdd={() => openCreate()} />}</div>}

                {view === "board" && <div className="grid gap-4 xl:grid-cols-4">{(Object.keys(statusLabels) as TaskStatus[]).map((status) => <section key={status} className="min-h-[460px] rounded-[1.7rem] border border-slate-200/70 bg-slate-100/60 p-3 dark:border-white/10 dark:bg-white/[0.025]"><div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${status === "completed" ? "bg-emerald-500" : status === "in_progress" ? "bg-indigo-500" : status === "waiting" ? "bg-amber-500" : "bg-slate-400"}`} /><h2 className="font-bold">{statusLabels[status]}</h2></div><span className="rounded-full bg-white px-2 py-1 text-xs font-bold shadow-sm dark:bg-white/10">{filteredTasks.filter((task) => task.status === status).length}</span></div><div className="space-y-3">{filteredTasks.filter((task) => task.status === status).map((task) => <CompactTask key={task.id} task={task} onOpen={openEdit} onStatus={(next) => void patchTask(task.id, { status: next })} />)}</div></section>)}</div>}

                {view === "matrix" && <div className="grid gap-4 lg:grid-cols-2">{(Object.keys(priorityMeta) as EisenhowerPriority[]).map((priority) => <section key={priority} className={`min-h-72 rounded-[1.8rem] border p-4 ${priorityMeta[priority].className}`}><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-black">{priorityMeta[priority].label}</h2><p className="text-xs text-slate-500 dark:text-slate-400">{priorityMeta[priority].subtitle}</p></div><span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold dark:bg-white/10">{filteredTasks.filter((task) => task.eisenhower === priority).length}</span></div><div className="grid gap-3 sm:grid-cols-2">{filteredTasks.filter((task) => task.eisenhower === priority).map((task) => <CompactTask key={task.id} task={task} onOpen={openEdit} onStatus={(next) => void patchTask(task.id, { status: next })} />)}</div></section>)}</div>}

                {view === "calendar" && <section className="overflow-hidden rounded-[1.8rem] border border-slate-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.045]"><div className="flex items-center justify-between border-b border-slate-200/70 p-4 dark:border-white/10"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft /></button><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-300">Calendar</p><h2 className="text-xl font-black">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h2></div><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight /></button></div><div className="grid grid-cols-7 border-b border-slate-200/70 bg-slate-50/80 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:border-white/10 dark:bg-white/[0.025]">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="p-3">{day}</div>)}</div><div className="grid grid-cols-7">{calendarDays.map((date) => { const dayTasks = filteredTasks.filter((task) => task.due_at && sameDay(new Date(task.due_at), date)); const today = sameDay(date, new Date()); return <button key={date.toISOString()} onClick={() => openCreate(date)} className={`min-h-28 border-b border-r border-slate-200/70 p-2 text-left transition hover:bg-indigo-50/70 dark:border-white/10 dark:hover:bg-indigo-400/5 ${date.getMonth() !== month.getMonth() ? "opacity-35" : ""}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${today ? "bg-indigo-600 text-white" : ""}`}>{date.getDate()}</span><div className="mt-2 space-y-1">{dayTasks.slice(0, 3).map((task) => <div key={task.id} onClick={(event) => { event.stopPropagation(); openEdit(task); }} className="truncate rounded-lg bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-200">{task.title}</div>)}{dayTasks.length > 3 && <p className="text-[10px] text-slate-400">+{dayTasks.length - 3} more</p>}</div></button>; })}</div></section>}

                {view === "analytics" && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.045]"><h2 className="text-lg font-black">Completion by status</h2><p className="mt-1 text-sm text-slate-500">Current workload distribution</p><div className="mt-6 space-y-4">{(Object.keys(statusLabels) as TaskStatus[]).map((status) => <Metric key={status} label={statusLabels[status]} value={tasks.filter((task) => task.status === status).length} total={Math.max(tasks.length, 1)} />)}</div></section><section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.045]"><h2 className="text-lg font-black">Last 7 days</h2><p className="mt-1 text-sm text-slate-500">Tasks completed each day</p><div className="mt-6 flex h-56 items-end gap-3">{stats.lastSevenDays.map((day) => { const max = Math.max(...stats.lastSevenDays.map((item) => item.count), 1); return <div key={day.label} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="relative flex flex-1 items-end rounded-xl bg-slate-100 dark:bg-white/5"><div className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-cyan-400" style={{ height: `${Math.max((day.count / max) * 100, day.count ? 12 : 3)}%` }} /><span className="absolute inset-x-0 top-2 text-center text-xs font-bold">{day.count}</span></div><span className="text-center text-xs text-slate-400">{day.label}</span></div>; })}</div></section></div>}
              </div>

              <aside className="hidden 2xl:block">
                <div className="sticky top-24 space-y-5">
                  <section className="overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-xl shadow-violet-600/20"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><BrainCircuit className="h-5 w-5" /></div><div><h2 className="font-bold">Flow Assistant</h2><p className="text-xs text-white/70">Your productivity guide</p></div></div><div className="mt-5 space-y-2">{suggestions.map((suggestion) => <div key={suggestion} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-sm leading-6 backdrop-blur">{suggestion}</div>)}</div></section>
                  <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.045]"><div className="flex items-center justify-between"><div><h3 className="font-bold">Today&apos;s progress</h3><p className="text-xs text-slate-400">Keep your momentum</p></div><span className="text-2xl font-black">{stats.completionRate}%</span></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500" style={{ width: `${stats.completionRate}%` }} /></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-100 p-3 dark:bg-white/5"><p className="text-xs text-slate-400">Open</p><p className="mt-1 text-xl font-black">{stats.total - stats.completed}</p></div><div className="rounded-2xl bg-emerald-500/10 p-3"><p className="text-xs text-emerald-600 dark:text-emerald-300">Done</p><p className="mt-1 text-xl font-black">{stats.completed}</p></div></div></section>
                </div>
              </aside>
            </section>
          </div>
        </section>
      </div>

      <WorkspaceNavigation
        variant="mobile"
        counts={{
          tasks: tasks.length,
        }}
      />

      {modalOpen && <TaskModal editing={editing} form={form} setForm={setForm} tagsText={tagsText} setTagsText={setTagsText} subtaskText={subtaskText} setSubtaskText={setSubtaskText} lists={lists} categories={categories} saving={saving} onClose={() => setModalOpen(false)} onSubmit={saveTask} />}

      <style jsx global>{`
        .task-field { margin-top: .5rem; width: 100%; border-radius: 1rem; border: 1px solid rgb(226 232 240); background: white; color: rgb(15 23 42); padding: .75rem .875rem; outline: none; transition: border-color .2s, box-shadow .2s; }
        .task-field:focus { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .12); }
        select.task-field, select.task-select { color-scheme: light; }
        select.task-field option, select.task-select option { background: white; color: rgb(15 23 42); }
        .dark .task-field { border-color: rgb(255 255 255 / .10); background: #0b1022; color: rgb(241 245 249); }
        .dark select.task-field, .dark select.task-select { color-scheme: dark; background-color: #0b1022; color: rgb(241 245 249); }
        .dark select.task-field option, .dark select.task-select option { background-color: #0b1022; color: rgb(241 245 249); }
      `}</style>
    </motion.main>
  );
}

function TaskCard({ task, risk, favorite, lists, categories, onEdit, onDelete, onDuplicate, onFavorite, onStatus }: { task: Task; risk?: TaskRiskPrediction; favorite: boolean; lists: TaskList[]; categories: TaskCategory[]; onEdit: (task: Task) => void; onDelete: (id: number) => void; onDuplicate: (task: Task) => void; onFavorite: (id: number) => void; onStatus: (status: TaskStatus) => void }) {
  const progress = taskProgress(task);
  const list = lists.find((item) => item.id === task.list_id);
  const category = categories.find((item) => item.id === task.category_id);
  return <article className="rounded-3xl border border-slate-200 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.05]"><div className="flex gap-3"><button onClick={() => onStatus(task.status === "completed" ? "not_started" : "completed")} className="mt-1">{task.status === "completed" ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-slate-400" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className={`text-lg font-black ${task.status === "completed" ? "line-through opacity-60" : ""}`}>{task.title}</h3>{task.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}</div><div className="flex items-center gap-1"><button onClick={() => onFavorite(task.id)} className={`rounded-xl p-2 ${favorite ? "text-amber-500" : "text-slate-400"}`}><Star className="h-4 w-4" fill={favorite ? "currentColor" : "none"} /></button><button onClick={() => void onDuplicate(task)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><Copy className="h-4 w-4" /></button><button onClick={() => onEdit(task)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button><button onClick={() => void onDelete(task.id)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div>{risk && task.status !== "completed" && <div className={`mt-3 rounded-2xl border p-3 ${risk.risk_level === "high" ? "border-rose-300 bg-rose-500/8 dark:border-rose-400/25" : risk.risk_level === "medium" ? "border-amber-300 bg-amber-500/8 dark:border-amber-400/25" : "border-emerald-300 bg-emerald-500/8 dark:border-emerald-400/25"}`}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-wide">AI completion forecast</span></div><div className="flex items-center gap-2"><span className="text-sm font-black">{Math.round(risk.completion_probability * 100)}%</span><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${risk.risk_level === "high" ? "bg-rose-500 text-white" : risk.risk_level === "medium" ? "bg-amber-500 text-slate-950" : "bg-emerald-500 text-white"}`}>{risk.risk_level} risk</span></div></div><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{risk.important_factors[0]}</p><p className="mt-1 text-xs font-semibold text-indigo-700 dark:text-cyan-300">{risk.recommended_action}</p></div>}<div className="mt-3 flex flex-wrap gap-2 text-xs">{list && <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-300">{list.name}</span>}{category && <span className="rounded-full px-2.5 py-1 text-white" style={{ background: category.color }}>{category.name}</span>}<span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-700 dark:text-violet-300">{priorityMeta[task.eisenhower].label}</span>{task.repeat_rule !== "none" && <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-cyan-700 dark:text-cyan-300">Repeats {task.repeat_rule}</span>}{task.due_at && <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10">Due {new Date(task.due_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>}{task.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10">#{tag}</span>)}</div>{task.subtasks.length > 0 && <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{task.subtasks.filter((item) => item.completed).length}/{task.subtasks.length} checklist</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${progress}%` }} /></div></div>}</div></div></article>;
}

function CompactTask({ task, onOpen, onStatus }: { task: Task; onOpen: (task: Task) => void; onStatus: (status: TaskStatus) => void }) {
  return <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#0b1022]"><button onClick={() => onOpen(task)} className="w-full text-left"><p className="font-bold">{task.title}</p>{task.due_at && <p className="mt-1 text-xs text-slate-500">{new Date(task.due_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>}</button><select value={task.status} onChange={(e) => onStatus(e.target.value as TaskStatus)} className="mt-3 w-full rounded-xl border border-slate-200 bg-transparent px-2 py-1.5 text-xs dark:border-white/10">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-white/15"><ListTodo className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-3 text-xl font-black">No tasks found</h2><p className="mt-1 text-sm text-slate-500">Change the filters or create a new task.</p><button onClick={onAdd} className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 font-bold text-white dark:bg-white dark:text-slate-950">Add task</button></div>;
}

function Metric({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.min(Math.round((value / total) * 100), 100);
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-bold">{value}</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600" style={{ width: `${percent}%` }} /></div></div>;
}

function TaskModal({ editing, form, setForm, tagsText, setTagsText, subtaskText, setSubtaskText, lists, categories, saving, onClose, onSubmit }: { editing: Task | null; form: TaskPayload; setForm: React.Dispatch<React.SetStateAction<TaskPayload>>; tagsText: string; setTagsText: (value: string) => void; subtaskText: string; setSubtaskText: (value: string) => void; lists: TaskList[]; categories: TaskCategory[]; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const addSubtask = () => {
    const title = subtaskText.trim();
    if (!title) return;
    const item: Subtask = { id: crypto.randomUUID(), title, completed: false };
    setForm((current) => ({ ...current, subtasks: [...current.subtasks, item] }));
    setSubtaskText("");
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-[#0b1022] sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600 dark:text-cyan-300">{editing ? "Edit task" : "New task"}</p><h2 className="text-2xl font-black">Task details</h2></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X /></button></div><form onSubmit={onSubmit} className="space-y-5"><div><label className="text-sm font-bold">Title</label><input required value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} className="task-field" placeholder="What needs to be done?" /></div><div><label className="text-sm font-bold">Notes</label><textarea value={form.description ?? ""} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="task-field min-h-24" placeholder="Add useful details..." /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="List"><select value={form.list_id ?? ""} onChange={(e) => setForm((current) => ({ ...current, list_id: e.target.value ? Number(e.target.value) : null }))} className="task-field"><option value="">No list</option>{lists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Category"><select value={form.category_id ?? ""} onChange={(e) => setForm((current) => ({ ...current, category_id: e.target.value ? Number(e.target.value) : null }))} className="task-field"><option value="">No category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as TaskStatus }))} className="task-field">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Eisenhower priority"><select value={form.eisenhower} onChange={(e) => setForm((current) => ({ ...current, eisenhower: e.target.value as EisenhowerPriority }))} className="task-field">{Object.entries(priorityMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></Field><Field label="Energy"><select value={form.energy_level} onChange={(e) => setForm((current) => ({ ...current, energy_level: e.target.value as EnergyLevel }))} className="task-field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field><Field label="Repeat"><select value={form.repeat_rule} onChange={(e) => setForm((current) => ({ ...current, repeat_rule: e.target.value as RepeatRule }))} className="task-field"><option value="none">Never</option><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></Field><Field label="Repeat every"><input type="number" min={1} max={365} value={form.repeat_interval} onChange={(e) => setForm((current) => ({ ...current, repeat_interval: Number(e.target.value) || 1 }))} className="task-field" /></Field><Field label="Start"><input type="datetime-local" value={toInputDate(form.start_at)} onChange={(e) => setForm((current) => ({ ...current, start_at: toApiDate(e.target.value) }))} className="task-field" /></Field><Field label="Due"><input type="datetime-local" value={toInputDate(form.due_at)} onChange={(e) => setForm((current) => ({ ...current, due_at: toApiDate(e.target.value) }))} className="task-field" /></Field><Field label="Repeat until"><input type="datetime-local" value={toInputDate(form.repeat_until)} onChange={(e) => setForm((current) => ({ ...current, repeat_until: toApiDate(e.target.value) }))} className="task-field" /></Field><Field label="Reminder"><input type="datetime-local" value={toInputDate(form.reminder_at)} onChange={(e) => setForm((current) => ({ ...current, reminder_at: toApiDate(e.target.value), reminder_enabled: Boolean(e.target.value) }))} className="task-field" /></Field><label className="flex items-center gap-3 rounded-2xl bg-violet-500/10 p-3 text-sm"><input type="checkbox" checked={form.is_all_day} onChange={(e) => setForm((current) => ({ ...current, is_all_day: e.target.checked }))} /> All-day task</label></div><div><label className="text-sm font-bold">Tags</label><div className="task-field flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /><input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="w-full bg-transparent outline-none" placeholder="assignment, urgent, reading" /></div></div><div><label className="text-sm font-bold">Checklist</label><div className="mt-2 flex gap-2"><input value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} className="task-field mt-0 min-w-0 flex-1" placeholder="Add a smaller step" /><button type="button" onClick={addSubtask} className="rounded-2xl bg-slate-900 px-4 text-white dark:bg-white dark:text-slate-950"><Plus /></button></div><div className="mt-2 space-y-2">{form.subtasks.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 dark:bg-white/10"><button type="button" onClick={() => setForm((current) => ({ ...current, subtasks: current.subtasks.map((subtask) => subtask.id === item.id ? { ...subtask, completed: !subtask.completed } : subtask) }))}>{item.completed ? <Check className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}</button><span className={`flex-1 text-sm ${item.completed ? "line-through opacity-60" : ""}`}>{item.title}</span><button type="button" onClick={() => setForm((current) => ({ ...current, subtasks: current.subtasks.filter((subtask) => subtask.id !== item.id) }))}><X className="h-4 w-4" /></button></div>)}</div></div><label className="flex items-center gap-3 rounded-2xl bg-violet-500/10 p-3 text-sm"><input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setForm((current) => ({ ...current, reminder_enabled: e.target.checked, reminder_at: e.target.checked ? current.reminder_at : null }))} /><Bell className="h-4 w-4 text-violet-500" /> Enable browser reminder</label><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold dark:border-white/10">Cancel</button><button disabled={saving} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Create task"}</button></div></form></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold">{label}{children}</label>;
}
