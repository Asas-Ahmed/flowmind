"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Filter,
  FolderPlus,
  LayoutDashboard,
  List,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { SpinnerLoader } from "@/components/common/spinner-loader";
import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  createTask,
  createTaskCategory,
  createTaskList,
  deleteTask,
  deleteTaskList,
  deleteTaskCategory,
  getTaskWorkspace,
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

const priorityMeta: Record<EisenhowerPriority, { label: string; className: string }> = {
  urgent_important: { label: "Do first", className: "bg-rose-500/12 text-rose-600 dark:text-rose-300" },
  important_not_urgent: { label: "Schedule", className: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
  urgent_not_important: { label: "Delegate", className: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  not_urgent_not_important: { label: "Later", className: "bg-slate-500/12 text-slate-600 dark:text-slate-300" },
};

const statusLabels: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  waiting: "Waiting",
  completed: "Completed",
};

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

export function TasksShell() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [listFilter, setListFilter] = useState<number | "all">("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskPayload>(blankTask());
  const [tagsText, setTagsText] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    let cancelled = false;

    getTaskWorkspace()
      .then((data) => {
        if (cancelled) return;

        setTasks(data.tasks);
        setLists(data.lists);
        setCategories(data.categories);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Unable to load tasks",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query) || task.tags.some((tag) => tag.includes(query));
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesList = listFilter === "all" || task.list_id === listFilter;
      return matchesSearch && matchesStatus && matchesList;
    });
  }, [tasks, search, statusFilter, listFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "completed").length,
      dueToday: tasks.filter((task) => task.due_at && sameDay(new Date(task.due_at), now) && task.status !== "completed").length,
      overdue: tasks.filter((task) => task.due_at && new Date(task.due_at) < now && task.status !== "completed").length,
    };
  }, [tasks]);

  const openCreate = (date?: Date) => {
    const next = blankTask();
    next.list_id = lists[0]?.id ?? null;
    if (date) {
      date.setHours(9, 0, 0, 0);
      next.due_at = date.toISOString();
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

  const toggleComplete = async (task: Task) => {
    const status: TaskStatus = task.status === "completed" ? "not_started" : "completed";
    try {
      const updated = await updateTask(task.id, { status });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    }
  };

  const removeTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tagsText
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .filter((tag) => tag !== tagToRemove);

    setTagsText(updatedTags.join(", "));
  };

  const addList = async () => {
    if (!newListName.trim()) return;
    const created = await createTaskList(newListName.trim(), "#4a6ded");
    setLists((current) => [...current, created]);
    setNewListName("");
  };

  const removeList = async (listId: number) => {
    const confirmed = window.confirm(
      "Delete this list? Tasks inside it will move to no list.",
    );

    if (!confirmed) return;

    try {
      await deleteTaskList(listId);

      setLists((current) =>
        current.filter((list) => list.id !== listId),
      );

      setTasks((current) =>
        current.map((task) =>
          task.list_id === listId
            ? { ...task, list_id: null }
            : task,
        ),
      );

      setForm((current) =>
        current.list_id === listId
          ? { ...current, list_id: null }
          : current,
      );

      if (listFilter === listId) {
        setListFilter("all");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete list",
      );
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const created = await createTaskCategory(newCategoryName.trim(), "#762bbc");
    setCategories((current) => [...current, created]);
    setNewCategoryName("");
  };

  const removeCategory = async (categoryId: number) => {
    const confirmed = window.confirm(
      "Delete this category? Tasks using it will become uncategorized.",
    );

    if (!confirmed) return;

    try {
      await deleteTaskCategory(categoryId);

      setCategories((current) =>
        current.filter((category) => category.id !== categoryId),
      );

      setTasks((current) =>
        current.map((task) =>
          task.category_id === categoryId
            ? { ...task, category_id: null }
            : task,
        ),
      );

      setForm((current) =>
        current.category_id === categoryId
          ? { ...current, category_id: null }
          : current,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category",
      );
    }
  };

  const addSubtask = () => {
    const title = subtaskText.trim();
    if (!title) return;
    const item: Subtask = { id: crypto.randomUUID(), title, completed: false };
    setForm((current) => ({ ...current, subtasks: [...current.subtasks, item] }));
    setSubtaskText("");
  };

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#050816]/80">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/dashboard")} className="rounded-2xl p-1"><FlowMindLogo size="md" variant="full" href="" /></button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => router.push("/settings")} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-white/[0.05]">
          <button onClick={() => router.push("/dashboard")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"><LayoutDashboard className="h-4 w-4" /> Dashboard</button>
          <button className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white"><ListTodo className="h-4 w-4" /> Tasks</button>

          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lists</p><FolderPlus className="h-4 w-4 text-slate-400" /></div>
            <button onClick={() => setListFilter("all")} className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${listFilter === "all" ? "bg-slate-100 font-semibold dark:bg-white/10" : "text-slate-600 dark:text-slate-300"}`}><List className="h-4 w-4" /> All tasks <span className="ml-auto">{tasks.length}</span></button>
            {lists.map((item) => ( <div key={item.id} className={`group mb-1 flex items-center rounded-xl ${ listFilter === item.id ? "bg-slate-100 font-semibold dark:bg-white/10" : "text-slate-600 dark:text-slate-300" }`} > <button type="button" onClick={() => setListFilter(item.id)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm" > <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} /> <span className="truncate">{item.name}</span> <span className="ml-auto"> {tasks.filter((task) => task.list_id === item.id).length} </span> </button> <button type="button" onClick={() => void removeList(item.id)} aria-label={`Delete ${item.name} list`} title="Delete list" className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 opacity-100 transition hover:bg-rose-500/10 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:text-rose-400" > <Trash2 className="h-4 w-4" /> </button> </div> ))}
            <div className="mt-2 flex gap-2"><input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="New list" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10" /><button onClick={() => void addList()} className="rounded-xl bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /></button></div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Categories</p>
            <div className="flex flex-wrap gap-2"> {categories.map((category) => ( <div key={category.id} className="group flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-semibold text-white" style={{ background: category.color }} > <span>{category.name}</span> <button type="button" onClick={() => void removeCategory(category.id)} aria-label={`Delete ${category.name} category`} title="Delete category" className="grid h-5 w-5 place-items-center rounded-full text-white/70 transition hover:bg-black/20 hover:text-white" > <X className="h-3 w-3" /> </button> </div> ))} </div>
            <div className="mt-2 flex gap-2"><input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-white/10" /><button onClick={() => void addCategory()} className="rounded-xl bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /></button></div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-sm font-semibold text-blue-600 dark:text-cyan-300">FlowMind Tasks</p><h1 className="text-3xl font-black tracking-tight">Plan clearly. Finish calmly.</h1></div>
            <button onClick={() => openCreate()} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20"><Plus className="h-5 w-5" /> Add task</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{ label: "All tasks", value: stats.total, icon: ListTodo }, { label: "Due today", value: stats.dueToday, icon: CalendarDays }, { label: "Overdue", value: stats.overdue, icon: Clock3 }, { label: "Completed", value: stats.completed, icon: CheckCircle2 }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.05]"><div className="flex items-center justify-between"><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><Icon className="h-4 w-4" /></div><p className="mt-2 text-3xl font-black">{value}</p></div>)}
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.05] md:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-100 px-3 dark:bg-white/10"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks, notes, or tags" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-slate-700 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-200"> <Filter className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" /> <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus) } aria-label="Filter tasks by status" className="min-w-36 cursor-pointer bg-transparent py-2 text-sm font-medium text-slate-700 outline-none [color-scheme:light] dark:text-slate-200 dark:[color-scheme:dark]" > <option value="all" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" > All statuses </option> {Object.entries(statusLabels).map(([value, label]) => ( <option key={value} value={value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" > {label} </option> ))} </select> </label>
            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-white/10"><button onClick={() => setView("list")} className={`rounded-xl p-2 ${view === "list" ? "bg-white shadow dark:bg-white/15" : ""}`}><List className="h-4 w-4" /></button><button onClick={() => setView("calendar")} className={`rounded-xl p-2 ${view === "calendar" ? "bg-white shadow dark:bg-white/15" : ""}`}><CalendarDays className="h-4 w-4" /></button></div>
          </div>

          {error && <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}

          {loading ? (
            <SpinnerLoader
              label="Loading your tasks..."
              className="min-h-72"
            />
          ) : view === "list" ? (
            <div className="space-y-3">
              {filteredTasks.length === 0 && <div className="rounded-[2rem] border border-dashed border-slate-300 p-12 text-center dark:border-white/15"><ListTodo className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-xl font-bold">No tasks here yet</h2><p className="mt-1 text-sm text-slate-500">Create a task or change the current filters.</p></div>}
              {filteredTasks.map((task) => {
                const category = categories.find((item) => item.id === task.category_id);
                const completeCount = task.subtasks.filter((item) => item.completed).length;
                return <article key={task.id} className="group rounded-[1.6rem] border border-slate-200 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.05]">
                  <div className="flex gap-3">
                    <button onClick={() => void toggleComplete(task)} className="mt-0.5 shrink-0">{task.status === "completed" ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-slate-300 hover:text-blue-500" />}</button>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`font-bold ${task.status === "completed" ? "text-slate-400 line-through" : ""}`}>{task.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${priorityMeta[task.eisenhower].className}`}>{priorityMeta[task.eisenhower].label}</span>{category && <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: category.color }}>{category.name}</span>}</div>{task.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}<div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">{task.due_at && <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><CalendarDays className="h-3 w-3" />{new Date(task.due_at).toLocaleString([], { dateStyle: "medium", timeStyle: task.is_all_day ? undefined : "short" })}</span>}{task.reminder_enabled && <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-600 dark:text-violet-300"><Bell className="h-3 w-3" /> Reminder</span>}{task.repeat_rule !== "none" && <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-600 dark:text-blue-300">Repeats {task.repeat_rule}</span>}{task.subtasks.length > 0 && <span>{completeCount}/{task.subtasks.length} subtasks</span>}{task.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div>
                    <div className="flex shrink-0 gap-1"><button onClick={() => openEdit(task)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button><button onClick={() => void removeTask(task.id)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></div>
                  </div>
                </article>;
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/[0.05]">
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-white/10"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft /></button><h2 className="text-lg font-black">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h2><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight /></button></div>
              <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-white/10">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="p-3">{day}</div>)}</div>
              <div className="grid grid-cols-7">{calendarDays.map((date) => { const dayTasks = filteredTasks.filter((task) => task.due_at && sameDay(new Date(task.due_at), date)); const active = date.getMonth() === month.getMonth(); return <button key={date.toISOString()} onClick={() => openCreate(new Date(date))} className={`min-h-28 border-b border-r border-slate-200 p-2 text-left align-top dark:border-white/10 ${active ? "" : "bg-slate-50/70 text-slate-300 dark:bg-black/10 dark:text-slate-600"}`}><span className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${sameDay(date, new Date()) ? "bg-blue-600 text-white" : ""}`}>{date.getDate()}</span><div className="mt-1 space-y-1">{dayTasks.slice(0, 3).map((task) => <div key={task.id} onClick={(event) => { event.stopPropagation(); openEdit(task); }} className="truncate rounded-md bg-blue-500/10 px-1.5 py-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">{task.title}</div>)}{dayTasks.length > 3 && <p className="text-[10px] text-slate-400">+{dayTasks.length - 3} more</p>}</div></button>; })}</div>
            </div>
          )}
        </section>
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-[#0b1022] sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600 dark:text-cyan-300">{editing ? "Edit task" : "New task"}</p><h2 className="text-2xl font-black">Task details</h2></div><button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X /></button></div>
        <form onSubmit={saveTask} className="space-y-5">
          <div><label className="text-sm font-bold">Title</label><input required value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-blue-500 dark:border-white/10" placeholder="What needs to be done?" /></div>
          <div><label className="text-sm font-bold">Notes</label><textarea value={form.description ?? ""} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-blue-500 dark:border-white/10" placeholder="Add useful details..." /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="List"><select value={form.list_id ?? ""} onChange={(e) => setForm((current) => ({ ...current, list_id: e.target.value ? Number(e.target.value) : null }))} className="field"><option value="">No list</option>{lists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Category"><select value={form.category_id ?? ""} onChange={(e) => setForm((current) => ({ ...current, category_id: e.target.value ? Number(e.target.value) : null }))} className="field"><option value="">No category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as TaskStatus }))} className="field">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Eisenhower priority"><select value={form.eisenhower} onChange={(e) => setForm((current) => ({ ...current, eisenhower: e.target.value as EisenhowerPriority }))} className="field">{Object.entries(priorityMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></Field>
            <Field label="Energy"><select value={form.energy_level} onChange={(e) => setForm((current) => ({ ...current, energy_level: e.target.value as EnergyLevel }))} className="field"><option value="low">Low energy</option><option value="medium">Medium energy</option><option value="high">High focus</option></select></Field>
            <Field label="Repeat"><select value={form.repeat_rule} onChange={(e) => setForm((current) => ({ ...current, repeat_rule: e.target.value as RepeatRule }))} className="field"><option value="none">Never</option><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></Field>
            <Field label="Start"><input type="datetime-local" value={toInputDate(form.start_at)} onChange={(e) => setForm((current) => ({ ...current, start_at: toApiDate(e.target.value) }))} className="field" /></Field>
            <Field label="Due"><input type="datetime-local" value={toInputDate(form.due_at)} onChange={(e) => setForm((current) => ({ ...current, due_at: toApiDate(e.target.value) }))} className="field" /></Field>
            <Field label="Reminder"><input type="datetime-local" value={toInputDate(form.reminder_at)} onChange={(e) => setForm((current) => ({ ...current, reminder_at: toApiDate(e.target.value), reminder_enabled: Boolean(e.target.value) }))} className="field" /></Field>
          </div>
          <div> <label className="text-sm font-bold">Tags</label> <div className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 dark:border-white/10"> <div className="flex items-center gap-2"> <Tag className="h-4 w-4 shrink-0 text-slate-400" /> <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="w-full bg-transparent py-1 outline-none" placeholder="assignment, urgent, reading" /> </div> {tagsText .split(",") .map((tag) => tag.trim().replace(/^#/, "")) .filter(Boolean).length > 0 && ( <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-200 pt-2 dark:border-white/10"> {tagsText .split(",") .map((tag) => tag.trim().replace(/^#/, "")) .filter(Boolean) .map((tag) => ( <span key={tag} className="flex items-center gap-1 rounded-full bg-violet-500/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-violet-700 dark:text-violet-300" > #{tag} <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`} title="Remove tag" className="grid h-5 w-5 place-items-center rounded-full transition hover:bg-violet-500/15" > <X className="h-3 w-3" /> </button> </span> ))} </div> )} </div> </div>
          <div><label className="text-sm font-bold">Subtasks</label><div className="mt-2 flex gap-2"><input value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-white/10" placeholder="Add a smaller step" /><button type="button" onClick={addSubtask} className="rounded-2xl bg-slate-900 px-4 text-white dark:bg-white dark:text-slate-950"><Plus /></button></div><div className="mt-2 space-y-2">{form.subtasks.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 dark:bg-white/10"><button type="button" onClick={() => setForm((current) => ({ ...current, subtasks: current.subtasks.map((subtask) => subtask.id === item.id ? { ...subtask, completed: !subtask.completed } : subtask) }))}>{item.completed ? <Check className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}</button><span className={`flex-1 text-sm ${item.completed ? "line-through opacity-60" : ""}`}>{item.title}</span><button type="button" onClick={() => setForm((current) => ({ ...current, subtasks: current.subtasks.filter((subtask) => subtask.id !== item.id) }))}><X className="h-4 w-4" /></button></div>)}</div></div>
          <label className="flex items-center gap-3 rounded-2xl bg-violet-500/10 p-3 text-sm"><input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setForm((current) => ({ ...current, reminder_enabled: e.target.checked, reminder_at: e.target.checked ? current.reminder_at : null }))} /><Bell className="h-4 w-4 text-violet-500" /> Enable Flow Assistant reminder</label>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold dark:border-white/10">Cancel</button><button disabled={saving} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Create task"}</button></div>
        </form></div></div>}
      <style jsx global>{`.field{margin-top:.5rem;width:100%;border-radius:1rem;border:1px solid rgb(226 232 240);background:transparent;padding:.75rem;outline:none}.dark .field{border-color:rgba(255,255,255,.1)}.field:focus{border-color:#4a6ded}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold">{label}{children}</label>;
}
