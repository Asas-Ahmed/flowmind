"use client";

import {
  BellRing,
  BrainCircuit,
  CalendarClock,
  CalendarDays,
  Columns3,
  ListFilter,
  Rows3,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coffee,
  ShieldCheck,
  Zap,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  WandSparkles,
  Target,
  Trash2,
  GripVertical,
  Lock,
  Unlock,
  Copy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  applySmartSchedule,
  createScheduleEvent,
  deleteScheduleEvent,
  getScheduleWorkspace,
  getSmartScheduleSuggestions,
  updateScheduleEvent,
} from "@/lib/api";
import type {
  ScheduleEvent,
  ScheduleEventPayload,
  ScheduleEventType,
  ScheduleItem,
  ScheduleWorkspace,
  SmartScheduleRequest,
  SmartScheduleResponse,
} from "@/types/schedule";

const EVENT_COLORS = ["#4a6ded", "#762bbc", "#cf4de1", "#0ea5e9", "#10b981", "#f59e0b"];
const EVENT_TYPES: ScheduleEventType[] = ["event", "meeting", "study", "focus", "personal"];
type CalendarView = "month" | "week" | "day" | "agenda" | "timeline";
const VIEW_OPTIONS: { value: CalendarView; label: string; icon: typeof CalendarDays }[] = [
  { value: "month", label: "Month", icon: CalendarDays },
  { value: "week", label: "Week", icon: Columns3 },
  { value: "day", label: "Day", icon: Rows3 },
  { value: "agenda", label: "Agenda", icon: ListFilter },
  { value: "timeline", label: "Timeline", icon: CalendarClock },
];

function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function initialForm(date = new Date()): ScheduleEventPayload {
  const start = new Date(date);
  start.setMinutes(0, 0, 0);
  start.setHours(Math.max(start.getHours() + 1, 9));
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    description: null,
    event_type: "event",
    color: EVENT_COLORS[0],
    location: null,
    task_id: null,
    start_at: localInputValue(start),
    end_at: localInputValue(end),
    is_all_day: false,
    reminder_enabled: true,
    reminder_minutes_before: 15,
  };
}

function dateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthBounds(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return { start, end };
}


function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function sameDay(a: Date | string, b: Date | string) {
  return dateKey(a) === dateKey(b);
}

function itemDuration(item: ScheduleItem) {
  if (!item.end_at) return 30;
  return Math.max(15, Math.round((new Date(item.end_at).getTime() - new Date(item.start_at).getTime()) / 60_000));
}

function formatRangeLabel(anchor: Date, view: CalendarView) {
  if (view === "month") return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (view === "day") return anchor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function sourceStyle(source: ScheduleItem["source"]) {
  return {
    event: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    task: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    habit: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    focus: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  }[source];
}

export function ScheduleShell() {
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [calendarQuery, setCalendarQuery] = useState("");
  const [visibleSources, setVisibleSources] = useState<ScheduleItem["source"][]>(["event", "task", "habit", "focus"]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [workspace, setWorkspace] = useState<ScheduleWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState<ScheduleEventPayload>(() => initialForm());
  const [smartOpen, setSmartOpen] = useState(false);
  const [smartResult, setSmartResult] = useState<SmartScheduleResponse | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);
  const [smartConfig, setSmartConfig] = useState<Omit<SmartScheduleRequest, "range_start" | "range_end" | "timezone_offset_minutes">>({
    workday_start_hour: 9,
    workday_end_hour: 18,
    slot_minutes: 30,
    break_minutes: 15,
    max_items: 8,
    include_weekends: false,
  });
  const [mountedAt] = useState(() => Date.now());

  const bounds = useMemo(() => monthBounds(month), [month]);

  const loadWorkspace = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getScheduleWorkspace(dateKey(bounds.start), dateKey(bounds.end)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load schedule.");
    }
  }, [bounds.end, bounds.start]);

  useEffect(() => {
    let cancelled = false;

    getScheduleWorkspace(dateKey(bounds.start), dateKey(bounds.end))
      .then((data) => {
        if (!cancelled) {
          setWorkspace(data);
          setError("");
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load schedule.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bounds.end, bounds.start]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const cursor = new Date(bounds.start);
    while (cursor <= bounds.end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [bounds]);

  const filteredItems = useMemo(() => {
    const query = calendarQuery.trim().toLowerCase();
    return (workspace?.items ?? []).filter((item) =>
      visibleSources.includes(item.source) &&
      (!query || `${item.title} ${item.description ?? ""} ${item.location ?? ""}`.toLowerCase().includes(query))
    );
  }, [calendarQuery, visibleSources, workspace]);

  const filteredItemsByDate = useMemo(() => {
    const grouped = new Map<string, ScheduleItem[]>();
    for (const item of filteredItems) {
      const key = dateKey(item.start_at);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return grouped;
  }, [filteredItems]);

  const selectedItems = filteredItemsByDate.get(dateKey(selectedDate)) ?? [];
  const selectedTimedItems = selectedItems
    .filter((item) => !item.is_all_day && item.end_at)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const selectedMinutes = selectedTimedItems.reduce((total, item) => total + itemDuration(item), 0);
  const selectedFocusMinutes = selectedTimedItems
    .filter((item) => item.source === "focus" || item.status === "focus" || item.status === "study")
    .reduce((total, item) => total + itemDuration(item), 0);
  const selectedConflicts = selectedTimedItems.reduce((count, item, index) => {
    if (index === 0) return count;
    const previous = selectedTimedItems[index - 1];
    return new Date(item.start_at) < new Date(previous.end_at ?? previous.start_at) ? count + 1 : count;
  }, 0);
  const dayCapacityMinutes = Math.max(60, (smartConfig.workday_end_hour - smartConfig.workday_start_hour) * 60);
  const capacityPercent = Math.min(100, Math.round((selectedMinutes / dayCapacityMinutes) * 100));
  const upcomingItems = (workspace?.items ?? [])
    .filter((item) => new Date(item.start_at).getTime() >= mountedAt)
    .slice(0, 5);

  function openCreate(date = selectedDate, endDate?: Date) {
    setEditing(null);
    const nextForm = initialForm(date);
    if (endDate) {
      nextForm.start_at = localInputValue(date);
      nextForm.end_at = localInputValue(endDate);
    }
    setForm(nextForm);
    setModalOpen(true);
  }

  function openEdit(event: ScheduleEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      color: event.color,
      location: event.location,
      task_id: event.task_id,
      start_at: localInputValue(new Date(event.start_at)),
      end_at: localInputValue(new Date(event.end_at)),
      is_all_day: event.is_all_day,
      reminder_enabled: event.reminder_enabled,
      reminder_minutes_before: event.reminder_minutes_before,
    });
    setModalOpen(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) {
      setError("Event title is required.");
      return;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setError("End time must be after the start time.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        location: form.location?.trim() || null,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
      };
      if (editing) await updateScheduleEvent(editing.id, payload);
      else await createScheduleEvent(payload);
      setModalOpen(false);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save event.");
    } finally {
      setBusy(false);
    }
  }

  async function moveOrResizeEvent(item: ScheduleItem, start: Date, end: Date) {
    if (item.source !== "event") return;
    setBusy(true);
    setError("");
    try {
      await updateScheduleEvent(item.source_id, {
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      });
      setSelectedDate(start);
      setMonth(start);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to move this time block.");
      await loadWorkspace();
    } finally {
      setBusy(false);
    }
  }

  async function duplicateEvent(event: ScheduleEvent) {
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    setBusy(true);
    setError("");
    try {
      await createScheduleEvent({
        title: `${event.title} copy`,
        description: event.description,
        event_type: event.event_type,
        color: event.color,
        location: event.location,
        task_id: event.task_id,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        is_all_day: event.is_all_day,
        reminder_enabled: event.reminder_enabled,
        reminder_minutes_before: event.reminder_minutes_before,
      });
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to duplicate event.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(eventId: number) {
    setBusy(true);
    try {
      await deleteScheduleEvent(eventId);
      setModalOpen(false);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete event.");
    } finally {
      setBusy(false);
    }
  }

  async function generateSmartPlan() {
    setBusy(true);
    setError("");
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 13);
      const result = await getSmartScheduleSuggestions({
        range_start: dateKey(start),
        range_end: dateKey(end),
        timezone_offset_minutes: new Date().getTimezoneOffset(),
        ...smartConfig,
      });
      setSmartResult(result);
      setSelectedSuggestions(result.suggestions.map((item) => item.task_id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate a smart schedule.");
    } finally {
      setBusy(false);
    }
  }

  async function createProtectedBlock(kind: "focus" | "break") {
    const start = new Date(selectedDate);
    const now = new Date();
    const defaultHour = kind === "focus" ? 9 : 13;
    start.setHours(sameDay(start, now) ? Math.max(now.getHours() + 1, defaultHour) : defaultHour, 0, 0, 0);
    const duration = kind === "focus" ? 90 : 30;
    const end = new Date(start.getTime() + duration * 60_000);
    setBusy(true);
    setError("");
    try {
      await createScheduleEvent({
        title: kind === "focus" ? "Protected focus time" : "Recovery break",
        description: kind === "focus"
          ? "FlowMind protected block — keep this time free from low-priority work."
          : "FlowMind recovery buffer — step away, hydrate, and reset.",
        event_type: kind === "focus" ? "focus" : "personal",
        color: kind === "focus" ? "#762bbc" : "#10b981",
        location: null,
        task_id: null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        is_all_day: false,
        reminder_enabled: true,
        reminder_minutes_before: kind === "focus" ? 15 : 5,
      });
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to protect this time.");
    } finally {
      setBusy(false);
    }
  }

  async function rebalanceSelectedDay() {
    const movableEvents = selectedTimedItems
      .filter((item) => item.source === "event" && item.status !== "meeting")
      .map((item) => workspace?.events.find((event) => event.id === item.source_id))
      .filter((event): event is ScheduleEvent => Boolean(event));

    if (movableEvents.length < 2) {
      setError("Add at least two movable events to rebalance this day.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const dayStart = new Date(selectedDate);
      dayStart.setHours(smartConfig.workday_start_hour, 0, 0, 0);
      let cursor = dayStart;

      for (const event of movableEvents.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())) {
        const originalStart = new Date(event.start_at);
        const duration = Math.max(15, Math.round((new Date(event.end_at).getTime() - originalStart.getTime()) / 60_000));
        const nextStart = new Date(Math.max(cursor.getTime(), originalStart.getTime()));
        const nextEnd = new Date(nextStart.getTime() + duration * 60_000);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(smartConfig.workday_end_hour, 0, 0, 0);
        if (nextEnd > dayEnd) break;
        if (nextStart.getTime() !== originalStart.getTime()) {
          await updateScheduleEvent(event.id, {
            start_at: nextStart.toISOString(),
            end_at: nextEnd.toISOString(),
          });
        }
        cursor = new Date(nextEnd.getTime() + smartConfig.break_minutes * 60_000);
      }
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to rebalance this day.");
    } finally {
      setBusy(false);
    }
  }

  async function applySmartPlan() {
    const suggestions = (smartResult?.suggestions ?? []).filter((item) =>
      selectedSuggestions.includes(item.task_id),
    );
    if (!suggestions.length) {
      setError("Select at least one suggestion to add.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await applySmartSchedule(suggestions);
      setSmartOpen(false);
      setSmartResult(null);
      setSelectedSuggestions([]);
      await loadWorkspace();
      if (result.skipped_count) {
        setError(`${result.created_count} block${result.created_count === 1 ? "" : "s"} added; ${result.skipped_count} skipped because the task or time was no longer available.`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to apply the smart schedule.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#070a12] dark:text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-slate-200 bg-white px-5 py-6 dark:border-white/[0.08] dark:bg-[#090d17] xl:block">
        <WorkspaceNavigation />
      </aside>

      <motion.main 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ 
          duration: 0.22, 
          ease: "easeOut", 
          }} 
        className="pb-28 xl:ml-[268px] xl:pb-8"
      >
        <div className="mx-auto max-w-[1580px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <WorkspaceTopbar
            eyebrow="Smart schedule"
            title="Plan your time, not just your tasks."
            description="Tasks, habits, focus sessions, reminders, and events in one timeline."
            maxWidth="max-w-[1580px]"
            actions={
              <>
                <button
                  type="button"
                  onClick={() => void loadWorkspace()}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300"
                  aria-label="Refresh schedule"
                  title="Refresh schedule"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => { setSmartOpen(true); setSmartResult(null); }}
                  className="flex h-11 items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-700 transition hover:-translate-y-0.5 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300"
                >
                  <WandSparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Smart plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add event</span>
                </button>
              </>
            }
          />

          {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">{error}</div>}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Target} label="Today" value={workspace?.today_count ?? 0} detail="scheduled items" />
            <Stat icon={Clock3} label="Upcoming" value={workspace?.upcoming_count ?? 0} detail="inside this calendar" />
            <Stat icon={BellRing} label="Reminders" value={workspace?.reminder_count ?? 0} detail="active reminders" />
            <Stat icon={CircleAlert} label="Overdue" value={workspace?.overdue_count ?? 0} detail="unfinished tasks" warning />
          </section>

          <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <CalendarWorkspace
              anchor={month}
              view={view}
              items={filteredItems}
              itemsByDate={filteredItemsByDate}
              calendarDays={calendarDays}
              selectedDate={selectedDate}
              query={calendarQuery}
              visibleSources={visibleSources}
              onAnchorChange={setMonth}
              onViewChange={setView}
              onDateSelect={setSelectedDate}
              onQueryChange={setCalendarQuery}
              onSourcesChange={setVisibleSources}
              onCreate={openCreate}
              onMove={(item, start, end) => void moveOrResizeEvent(item, start, end)}
              onEdit={(item) => {
                const event = workspace?.events.find((entry) => entry.id === item.source_id);
                if (event) openEdit(event);
              }}
            />

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <div className="flex items-center justify-between"><div><p className="text-sm font-bold">{selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedItems.length} scheduled items</p></div><button onClick={() => openCreate(selectedDate)} className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"><Plus className="h-4 w-4" /></button></div>
                <div className="mt-4 space-y-3">{selectedItems.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-white/10">Nothing scheduled yet.</div> : selectedItems.map((item) => <AgendaItem key={item.id} item={item} onEdit={() => { const event = workspace?.events.find((entry) => entry.id === item.source_id); if (event) openEdit(event); }} />)}</div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-violet-500" /> Adaptive day controls</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Protect important work and let FlowMind repair movable blocks around conflicts.</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedConflicts ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"}`}>{selectedConflicts ? `${selectedConflicts} conflict${selectedConflicts === 1 ? "" : "s"}` : "Conflict free"}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <SmartMetric label="Booked" value={`${Math.round(selectedMinutes / 60 * 10) / 10}h`} />
                  <SmartMetric label="Focus" value={`${Math.round(selectedFocusMinutes / 60 * 10) / 10}h`} />
                  <SmartMetric label="Capacity" value={`${capacityPercent}%`} />
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className={`h-full rounded-full transition-all ${capacityPercent > 90 ? "bg-rose-500" : capacityPercent > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${capacityPercent}%` }} /></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button disabled={busy} type="button" onClick={() => void createProtectedBlock("focus")} className="flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><Zap className="h-4 w-4" /> Protect focus</button>
                  <button disabled={busy} type="button" onClick={() => void createProtectedBlock("break")} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Coffee className="h-4 w-4" /> Add break</button>
                  <button disabled={busy} type="button" onClick={() => void rebalanceSelectedDay()} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"><RefreshCw className="h-4 w-4" /> Rebalance</button>
                </div>
              </div>

              <button type="button" onClick={() => { setSmartOpen(true); setSmartResult(null); }} className="w-full rounded-[26px] border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-violet-400/15 dark:from-violet-500/10 dark:via-white/[0.025] dark:to-cyan-500/10"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20"><BrainCircuit className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">Build a smart plan</p><WandSparkles className="h-4 w-4 text-violet-500" /></div><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Turn unfinished tasks into conflict-free focus blocks using deadlines, priority, energy demand, work hours, and recovery buffers.</p></div></div></button>

              <div className="rounded-[26px] border border-blue-200/70 bg-gradient-to-br from-blue-50 to-violet-50 p-5 dark:border-blue-400/15 dark:from-blue-500/10 dark:to-violet-500/10"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-300"><Sparkles className="h-5 w-5" /></div><div><p className="text-sm font-bold">Flow Assistant</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace?.overdue_count ? `You have ${workspace.overdue_count} overdue task${workspace.overdue_count === 1 ? "" : "s"}. Clear one before adding more work.` : selectedItems.length > 5 ? "This day looks busy. Protect at least one break between demanding blocks." : "Your schedule has healthy space. Add one focused priority and keep the rest flexible."}</p></div></div></div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]"><p className="text-sm font-bold">Next up</p><div className="mt-4 space-y-3">{upcomingItems.length === 0 ? <p className="text-sm text-slate-400">No upcoming items.</p> : upcomingItems.map((item) => <AgendaItem key={item.id} item={item} compact />)}</div></div>
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />

      {smartOpen && (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#0b0f19] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300"><BrainCircuit className="h-4 w-4" /> Explainable scheduler</div>
                <h2 className="mt-2 text-2xl font-bold">Create a balanced task plan</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">FlowMind ranks open tasks and places them only in free time. Review every recommendation before adding it.</p>
              </div>
              <button type="button" onClick={() => setSmartOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Workday starts"><select className="input cursor-pointer" value={smartConfig.workday_start_hour} onChange={(event) => setSmartConfig({ ...smartConfig, workday_start_hour: Number(event.target.value) })}>{[6,7,8,9,10,11,12].map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></Field>
              <Field label="Workday ends"><select className="input cursor-pointer" value={smartConfig.workday_end_hour} onChange={(event) => setSmartConfig({ ...smartConfig, workday_end_hour: Number(event.target.value) })}>{[15,16,17,18,19,20,21,22,23].map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></Field>
              <Field label="Break buffer"><select className="input cursor-pointer" value={smartConfig.break_minutes} onChange={(event) => setSmartConfig({ ...smartConfig, break_minutes: Number(event.target.value) })}><option value={0}>No buffer</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option></select></Field>
              <Field label="Maximum tasks"><select className="input cursor-pointer" value={smartConfig.max_items} onChange={(event) => setSmartConfig({ ...smartConfig, max_items: Number(event.target.value) })}>{[4,6,8,10,12].map((count) => <option key={count} value={count}>{count} tasks</option>)}</select></Field>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={smartConfig.include_weekends} onChange={(event) => setSmartConfig({ ...smartConfig, include_weekends: event.target.checked })} /> Include weekends in the next 14 days</label>

            {!smartResult ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-violet-200 bg-violet-50/60 px-6 py-10 text-center dark:border-violet-400/20 dark:bg-violet-400/[0.06]">
                <CalendarClock className="mx-auto h-9 w-9 text-violet-500" />
                <p className="mt-3 text-base font-bold">Ready to find your best available blocks</p>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">The scheduler will not move existing events. It only suggests space for unfinished tasks that are not already linked to the calendar.</p>
                <button disabled={busy} type="button" onClick={() => void generateSmartPlan()} className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Analysing..." : "Generate suggestions"}</button>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <SmartMetric label="Open tasks" value={smartResult.unscheduled_task_count} />
                  <SmartMetric label="Planned time" value={`${smartResult.scheduled_minutes} min`} />
                  <SmartMetric label="Still unscheduled" value={smartResult.remaining_task_count} />
                </div>
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">{smartResult.explanation}</p>
                <div className="mt-4 space-y-3">
                  {smartResult.suggestions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-white/10">No available suggestion was found with these settings.</div> : smartResult.suggestions.map((suggestion) => {
                    const selected = selectedSuggestions.includes(suggestion.task_id);
                    return <button type="button" key={suggestion.task_id} onClick={() => setSelectedSuggestions((current) => selected ? current.filter((id) => id !== suggestion.task_id) : [...current, suggestion.task_id])} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-400/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02]"}`}>
                      <div className="flex items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 dark:border-white/20"}`}>{selected && <Check className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{suggestion.task_title}</p><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">score {suggestion.score}</span></div><p className="mt-1 text-sm font-semibold text-violet-700 dark:text-violet-300">{new Date(suggestion.start_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(suggestion.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–{new Date(suggestion.end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {suggestion.duration_minutes} min</p><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{suggestion.reason}</p>{suggestion.warning && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">{suggestion.warning}</p>}</div></div>
                    </button>;
                  })}
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button disabled={busy} type="button" onClick={() => void generateSmartPlan()} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-white/10">Regenerate</button>
                  <button disabled={busy || selectedSuggestions.length === 0} type="button" onClick={() => void applySmartPlan()} className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Adding blocks..." : `Add ${selectedSuggestions.length} selected block${selectedSuggestions.length === 1 ? "" : "s"}`}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modalOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-[#0b0f19]"><div className="flex items-center justify-between"><div><p className="text-lg font-bold">{editing ? "Edit event" : "Create event"}</p><p className="mt-1 text-xs text-slate-500">Add a dedicated time block to your FlowMind schedule.</p></div><button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Deep work, class, meeting..." /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Type"><select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as ScheduleEventType })} className="input cursor-pointer capitalize">{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Location"><input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value || null })} className="input" placeholder="Optional" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Starts"><input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="input cursor-pointer" /></Field><Field label="Ends"><input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className="input cursor-pointer" /></Field></div><Field label="Description"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value || null })} rows={3} className="input resize-none" placeholder="Optional notes" /></Field><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Color</p><div className="flex gap-2">{EVENT_COLORS.map((color) => <button key={color} onClick={() => setForm({ ...form, color })} className={`h-8 w-8 rounded-full border-4 ${form.color === color ? "border-slate-950 dark:border-white" : "border-transparent"}`} style={{ backgroundColor: color }} />)}</div></div><div className="grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={form.is_all_day} onChange={(e) => setForm({ ...form, is_all_day: e.target.checked })} /> All-day event</label><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setForm({ ...form, reminder_enabled: e.target.checked })} /> Reminder enabled</label></div>{form.reminder_enabled && <Field label="Remind before"><select value={form.reminder_minutes_before} onChange={(e) => setForm({ ...form, reminder_minutes_before: Number(e.target.value) })} className="input cursor-pointer"><option value={0}>At start time</option><option value={5}>5 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option></select></Field>}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-3">{editing ? <div className="flex items-center gap-2"><button disabled={busy} onClick={() => void removeEvent(editing.id)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10"><Trash2 className="h-4 w-4" /> Delete</button><button disabled={busy} onClick={() => void duplicateEvent(editing)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-400/10"><Copy className="h-4 w-4" /> Duplicate</button></div> : <span />}<button disabled={busy} onClick={() => void saveEvent()} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{busy ? "Saving..." : editing ? "Save changes" : "Create event"}</button></div></div></div>}
      <style jsx global>{` .input { width: 100%; border-radius: 1rem; border: 1px solid rgb(226 232 240); background: rgb(248 250 252); color: rgb(15 23 42); padding: 0.75rem 1rem; font-size: 0.875rem; outline: none; appearance: none; transition: border-color .2s, background-color .2s, color .2s; } .dark .input { border-color: rgba(255,255,255,.10); background: rgb(15 23 42); /* slate-900 */ color: rgb(248 250 252); } .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,.12); } /* Fix dropdown menu in dark mode */ .dark select.input option { background: rgb(15 23 42); color: rgb(248 250 252); } .dark select.input optgroup { background: rgb(15 23 42); color: rgb(248 250 252); } `}</style>
    </div>
  );
}

function CalendarWorkspace({
  anchor,
  view,
  items,
  itemsByDate,
  calendarDays,
  selectedDate,
  query,
  visibleSources,
  onAnchorChange,
  onViewChange,
  onDateSelect,
  onQueryChange,
  onSourcesChange,
  onCreate,
  onEdit,
  onMove,
}: {
  anchor: Date;
  view: CalendarView;
  items: ScheduleItem[];
  itemsByDate: Map<string, ScheduleItem[]>;
  calendarDays: Date[];
  selectedDate: Date;
  query: string;
  visibleSources: ScheduleItem["source"][];
  onAnchorChange: (value: Date) => void;
  onViewChange: (value: CalendarView) => void;
  onDateSelect: (value: Date) => void;
  onQueryChange: (value: string) => void;
  onSourcesChange: (value: ScheduleItem["source"][]) => void;
  onCreate: (date?: Date, endDate?: Date) => void;
  onEdit: (item: ScheduleItem) => void;
  onMove: (item: ScheduleItem, start: Date, end: Date) => void;
}) {
  const [snapMinutes, setSnapMinutes] = useState(15);
  const [compact, setCompact] = useState(false);

  function move(direction: -1 | 1) {
    if (view === "month") onAnchorChange(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
    else if (view === "day") onAnchorChange(addDays(anchor, direction));
    else onAnchorChange(addDays(anchor, direction * 7));
  }

  const toggleSource = (source: ScheduleItem["source"]) => {
    onSourcesChange(visibleSources.includes(source) ? visibleSources.filter((item) => item !== source) : [...visibleSources, source]);
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
      <div className="border-b border-slate-100 p-4 dark:border-white/[0.07]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => move(-1)} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.06]" aria-label="Previous period"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => { const today = new Date(); onAnchorChange(today); onDateSelect(today); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.06]">Today</button>
            <button onClick={() => move(1)} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.06]" aria-label="Next period"><ChevronRight className="h-5 w-5" /></button>
            <div className="ml-2 min-w-0"><p className="truncate text-lg font-bold">{formatRangeLabel(anchor, view)}</p><p className="text-xs text-slate-500 dark:text-slate-400">{items.length} visible schedule items</p></div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px] flex-1 xl:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search schedule" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/[0.04]" /></div>
            {(view === "week" || view === "day") && <>
              <select value={snapMinutes} onChange={(event) => setSnapMinutes(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold outline-none dark:border-white/10 dark:bg-white/[0.04]" title="Drag snapping"><option value={5}>5 min snap</option><option value={10}>10 min snap</option><option value={15}>15 min snap</option><option value={30}>30 min snap</option></select>
              <button type="button" onClick={() => setCompact((value) => !value)} className={`h-10 rounded-xl border px-3 text-xs font-bold ${compact ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"}`}>{compact ? "Comfortable" : "Compact"}</button>
            </>}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.035]">{VIEW_OPTIONS.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => onViewChange(value)} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${view === value ? "bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`} title={`${label} view`}><Icon className="h-3.5 w-3.5" /><span className="hidden 2xl:inline">{label}</span></button>)}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">{(["event", "task", "habit", "focus"] as ScheduleItem["source"][]).map((source) => <button key={source} onClick={() => toggleSource(source)} className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition ${visibleSources.includes(source) ? sourceStyle(source) + " border-transparent" : "border-slate-200 text-slate-400 dark:border-white/10"}`}>{source}</button>)}{(view === "week" || view === "day") && <span className="ml-auto hidden items-center gap-2 text-[10px] font-semibold text-slate-400 lg:flex"><GripVertical className="h-3.5 w-3.5" /> Drag blocks to move · drag bottom edge to resize · drag empty space to create</span>}</div>
      </div>

      {view === "month" && <MonthCalendar anchor={anchor} days={calendarDays} itemsByDate={itemsByDate} selectedDate={selectedDate} onDateSelect={onDateSelect} onCreate={onCreate} onMove={onMove} />}
      {view === "week" && <TimeGrid days={Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchor), index))} items={items} onDateSelect={onDateSelect} onCreate={onCreate} onEdit={onEdit} onMove={onMove} snapMinutes={snapMinutes} compact={compact} />}
      {view === "day" && <TimeGrid days={[anchor]} items={items} onDateSelect={onDateSelect} onCreate={onCreate} onEdit={onEdit} onMove={onMove} snapMinutes={snapMinutes} compact={compact} />}
      {view === "agenda" && <AgendaView anchor={anchor} items={items} onDateSelect={onDateSelect} onEdit={onEdit} />}
      {view === "timeline" && <TimelineView anchor={anchor} items={items} onEdit={onEdit} />}
    </div>
  );
}

function MonthCalendar({ anchor, days, itemsByDate, selectedDate, onDateSelect, onCreate, onMove }: { anchor: Date; days: Date[]; itemsByDate: Map<string, ScheduleItem[]>; selectedDate: Date; onDateSelect: (date: Date) => void; onCreate: (date?: Date, endDate?: Date) => void; onMove: (item: ScheduleItem, start: Date, end: Date) => void }) {
  const [dragged, setDragged] = useState<ScheduleItem | null>(null);
  return <><div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.025]">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-3">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const dayItems = itemsByDate.get(dateKey(day)) ?? []; const selected = sameDay(day, selectedDate); const today = sameDay(day, new Date()); const muted = day.getMonth() !== anchor.getMonth(); return <div key={dateKey(day)} onClick={() => onDateSelect(day)} onDoubleClick={() => onCreate(day)} onDragOver={(event) => { if (dragged) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (!dragged || dragged.source !== "event") return; const originalStart = new Date(dragged.start_at); const originalEnd = new Date(dragged.end_at ?? dragged.start_at); const duration = originalEnd.getTime() - originalStart.getTime(); const nextStart = new Date(day); nextStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0); onMove(dragged, nextStart, new Date(nextStart.getTime() + duration)); setDragged(null); }} className={`min-h-28 border-b border-r border-slate-100 p-2 text-left transition dark:border-white/[0.06] sm:min-h-36 ${selected ? "bg-blue-50/70 dark:bg-blue-400/[0.07]" : "hover:bg-slate-50 dark:hover:bg-white/[0.025]"}`}><div className="flex items-center justify-between"><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${today ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : muted ? "text-slate-300 dark:text-slate-700" : "text-slate-600 dark:text-slate-300"}`}>{day.getDate()}</span>{dayItems.length > 0 && <span className="text-[9px] font-bold text-slate-400">{dayItems.length}</span>}</div><div className="mt-2 space-y-1">{dayItems.slice(0, 4).map((item) => <div key={item.id} draggable={item.source === "event"} onDragStart={(event) => { if (item.source !== "event") return; event.stopPropagation(); setDragged(item); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragged(null)} className={`truncate rounded-md px-1.5 py-1 text-[10px] font-semibold text-white shadow-sm ${item.source === "event" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`} style={{ backgroundColor: item.color }} title={item.source === "event" ? "Drag to another day" : "Linked items are read-only here"}>{item.is_all_day ? "" : new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · "}{item.title}</div>)}{dayItems.length > 4 && <p className="px-1 text-[10px] font-semibold text-slate-400">+{dayItems.length - 4} more</p>}</div></div>; })}</div></>;
}

type GridInteraction = {
  mode: "move" | "resize" | "create";
  item?: ScheduleItem;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  originalDuration: number;
  pointerOffsetMinutes: number;
};

function TimeGrid({ days, items, onDateSelect, onCreate, onEdit, onMove, snapMinutes, compact }: { days: Date[]; items: ScheduleItem[]; onDateSelect: (date: Date) => void; onCreate: (date?: Date, endDate?: Date) => void; onEdit: (item: ScheduleItem) => void; onMove: (item: ScheduleItem, start: Date, end: Date) => void; snapMinutes: number; compact: boolean }) {
  const gridStartHour = 5;
  const gridEndHour = 24;
  const hourHeight = compact ? 58 : 84;
  const totalMinutes = (gridEndHour - gridStartHour) * 60;
  const totalHeight = (gridEndHour - gridStartHour) * hourHeight;
  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [interaction, setInteraction] = useState<GridInteraction | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ dayIndex: number; minutes: number } | null>(null);

  const snap = useCallback((minutes: number) => Math.round(minutes / snapMinutes) * snapMinutes, [snapMinutes]);
  const clamp = useCallback((minutes: number) => Math.max(0, Math.min(totalMinutes, minutes)), [totalMinutes]);

  function dayIndexFromPointer(clientX: number, fallback: number) {
    const found = columnRefs.current.findIndex((column) => {
      if (!column) return false;
      const rect = column.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right;
    });
    return found >= 0 ? found : fallback;
  }

  function minutesFromPointer(dayIndex: number, clientY: number) {
    const rect = columnRefs.current[dayIndex]?.getBoundingClientRect();
    if (!rect) return 0;
    return clamp(snap(((clientY - rect.top) / rect.height) * totalMinutes));
  }

  function dateFromMinutes(dayIndex: number, minutes: number) {
    const date = new Date(days[dayIndex]);
    date.setHours(gridStartHour, 0, 0, 0);
    date.setMinutes(minutes);
    return date;
  }

  function beginCreate(event: React.PointerEvent<HTMLDivElement>, dayIndex: number) {
    if ((event.target as HTMLElement).closest("[data-calendar-event]")) return;
    const minutes = minutesFromPointer(dayIndex, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction({ mode: "create", dayIndex, startMinutes: minutes, endMinutes: Math.min(totalMinutes, minutes + snapMinutes), originalDuration: snapMinutes, pointerOffsetMinutes: 0 });
  }

  function beginMove(event: React.PointerEvent<HTMLButtonElement>, item: ScheduleItem, dayIndex: number) {
    if (item.source !== "event") return;
    event.preventDefault();
    event.stopPropagation();
    const start = new Date(item.start_at);
    const startMinutes = (start.getHours() - gridStartHour) * 60 + start.getMinutes();
    const duration = itemDuration(item);
    const pointerMinutes = minutesFromPointer(dayIndex, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction({ mode: "move", item, dayIndex, startMinutes, endMinutes: startMinutes + duration, originalDuration: duration, pointerOffsetMinutes: pointerMinutes - startMinutes });
  }

  function beginResize(event: React.PointerEvent<HTMLSpanElement>, item: ScheduleItem, dayIndex: number) {
    if (item.source !== "event") return;
    event.preventDefault();
    event.stopPropagation();
    const start = new Date(item.start_at);
    const startMinutes = (start.getHours() - gridStartHour) * 60 + start.getMinutes();
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction({ mode: "resize", item, dayIndex, startMinutes, endMinutes: startMinutes + itemDuration(item), originalDuration: itemDuration(item), pointerOffsetMinutes: 0 });
  }

  function updateInteraction(
    event: React.PointerEvent<HTMLDivElement>,
    dayIndex: number,
  ) {
    const targetDayIndex = dayIndexFromPointer(event.clientX, dayIndex);

    setHoverSlot({
      dayIndex: targetDayIndex,
      minutes: minutesFromPointer(targetDayIndex, event.clientY),
    });

    if (!interaction) return;

    const pointerMinutes = minutesFromPointer(
      targetDayIndex,
      event.clientY,
    );

    if (interaction.mode === "move") {
      const startMinutes = clamp(
        pointerMinutes - interaction.pointerOffsetMinutes,
      );

      const boundedStart = Math.min(
        totalMinutes - interaction.originalDuration,
        startMinutes,
      );

      setInteraction({
        ...interaction,
        dayIndex: targetDayIndex,
        startMinutes: boundedStart,
        endMinutes: boundedStart + interaction.originalDuration,
      });

      return;
    }

    if (interaction.mode === "resize") {
      setInteraction({
        ...interaction,
        dayIndex: interaction.dayIndex,
        endMinutes: Math.max(
          interaction.startMinutes + snapMinutes,
          pointerMinutes,
        ),
      });

      return;
    }

    setInteraction({
      ...interaction,
      dayIndex: targetDayIndex,
      endMinutes: Math.max(
        interaction.startMinutes + snapMinutes,
        pointerMinutes,
      ),
    });
  }

  function finishInteraction() {
    if (!interaction) return;
    const start = dateFromMinutes(interaction.dayIndex, interaction.startMinutes);
    const end = dateFromMinutes(interaction.dayIndex, interaction.endMinutes);
    if (interaction.mode === "create") onCreate(start, end);
    else if (interaction.item) onMove(interaction.item, start, end);
    setInteraction(null);
  }

  const allDayItems = days.map((day) => items.filter((item) => sameDay(item.start_at, day) && item.is_all_day));
  const now = new Date();
  const nowMinutes = (now.getHours() - gridStartHour) * 60 + now.getMinutes();

  return <div className="overflow-auto"><div className={days.length === 1 ? "min-w-[520px]" : "min-w-[980px]"}>
    <div className="grid border-b border-slate-100 dark:border-white/[0.06]" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(150px, 1fr))` }}><div /><>{days.map((day) => <button key={dateKey(day)} onClick={() => onDateSelect(day)} className={`border-l border-slate-100 px-3 py-3 text-center dark:border-white/[0.06] ${sameDay(day, new Date()) ? "bg-blue-50 dark:bg-blue-400/[0.06]" : ""}`}><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{day.toLocaleDateString(undefined, { weekday: "short" })}</p><p className="mt-1 text-lg font-bold">{day.getDate()}</p></button>)}</></div>
    {allDayItems.some((entries) => entries.length) && <div className="grid border-b border-slate-100 dark:border-white/[0.06]" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(150px, 1fr))` }}><div className="px-2 py-3 text-right text-[9px] font-bold uppercase tracking-wider text-slate-400">All day</div>{allDayItems.map((entries, dayIndex) => <div key={dayIndex} className="min-h-12 space-y-1 border-l border-slate-100 p-2 dark:border-white/[0.06]">{entries.map((item) => <button key={item.id} onClick={() => item.source === "event" && onEdit(item)} className="block w-full truncate rounded-lg px-2 py-1 text-left text-[10px] font-bold text-white" style={{ backgroundColor: item.color }}>{item.title}</button>)}</div>)}</div>}
    <div className="grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(150px, 1fr))` }}>
      <div className="relative" style={{ height: totalHeight }}>{Array.from({ length: gridEndHour - gridStartHour + 1 }, (_, index) => <div key={index} className="absolute right-3 -translate-y-1/2 text-[10px] font-semibold text-slate-400" style={{ top: index * hourHeight }}>{new Date(2020, 1, 1, gridStartHour + index).toLocaleTimeString([], { hour: "numeric" })}</div>)}</div>
      {days.map((day, dayIndex) => {
        const dayItems = items.filter((item) => sameDay(item.start_at, day) && !item.is_all_day);
        return <div key={dateKey(day)} ref={(node) => { columnRefs.current[dayIndex] = node; }} onPointerDown={(event) => beginCreate(event, dayIndex)} onPointerMove={(event) => updateInteraction(event, dayIndex)} onPointerUp={finishInteraction} onPointerCancel={() => setInteraction(null)} onPointerLeave={() => setHoverSlot(null)} className={`relative touch-none border-l border-slate-100 dark:border-white/[0.06] ${sameDay(day, new Date()) ? "bg-blue-50/25 dark:bg-blue-400/[0.025]" : ""}`} style={{ height: totalHeight }}>
          {Array.from({ length: gridEndHour - gridStartHour + 1 }, (_, index) => <div key={index} className="pointer-events-none absolute inset-x-0 border-t border-slate-100 dark:border-white/[0.06]" style={{ top: index * hourHeight }} />)}
          {Array.from({ length: (gridEndHour - gridStartHour) * 2 }, (_, index) => <div key={`half-${index}`} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-100/60 dark:border-white/[0.035]" style={{ top: index * hourHeight / 2 }} />)}
          {sameDay(day, now) && nowMinutes >= 0 && nowMinutes <= totalMinutes && <div className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-rose-500" style={{ top: nowMinutes / 60 * hourHeight }}><span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-rose-500" /></div>}
          {hoverSlot?.dayIndex === dayIndex && !interaction && <div className="pointer-events-none absolute inset-x-1 rounded-lg bg-blue-500/10 ring-1 ring-blue-400/30" style={{ top: hoverSlot.minutes / 60 * hourHeight, height: snapMinutes / 60 * hourHeight }} />}
          {dayItems.map((item) => {
            const start = new Date(item.start_at);
            const startMinutes = (start.getHours() - gridStartHour) * 60 + start.getMinutes();
            const isInteracting = interaction?.item?.id === item.id;
            const renderDayIndex = isInteracting ? interaction.dayIndex : dayIndex;
            if (renderDayIndex !== dayIndex) return null;
            const renderStart = isInteracting ? interaction.startMinutes : startMinutes;
            const renderEnd = isInteracting ? interaction.endMinutes : startMinutes + itemDuration(item);
            const top = Math.max(0, renderStart / 60 * hourHeight);
            const height = Math.max(28, (renderEnd - renderStart) / 60 * hourHeight);
            const movable = item.source === "event";
            return <button data-calendar-event key={item.id} type="button" onPointerDown={(event) => beginMove(event, item, dayIndex)} onDoubleClick={() => movable && onEdit(item)} className={`absolute inset-x-1 z-10 overflow-hidden rounded-xl px-2 py-1.5 text-left text-[10px] font-bold text-white shadow-md transition-shadow hover:z-30 hover:shadow-lg ${movable ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-90"} ${isInteracting ? "z-40 ring-2 ring-white/80 shadow-xl" : ""}`} style={{ top, height, backgroundColor: item.color }} title={movable ? "Drag to move · double-click to edit · resize from bottom" : "Linked FlowMind item — edit it from its source workspace"}><div className="flex items-start gap-1"><span className="min-w-0 flex-1"><span className="block truncate">{item.title}</span><span className="mt-0.5 block truncate text-white/80">{dateFromMinutes(dayIndex, renderStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–{dateFromMinutes(dayIndex, renderEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></span>{movable ? <Unlock className="mt-0.5 h-3 w-3 shrink-0 text-white/75" /> : <Lock className="mt-0.5 h-3 w-3 shrink-0 text-white/75" />}</div>{movable && <span onPointerDown={(event) => beginResize(event, item, dayIndex)} className="absolute inset-x-1 bottom-0 h-2 cursor-ns-resize rounded-b-xl bg-white/0 hover:bg-white/25" aria-label="Resize event" />}</button>;
          })}
          {interaction?.mode === "create" && interaction.dayIndex === dayIndex && <div className="pointer-events-none absolute inset-x-1 z-30 rounded-xl border-2 border-dashed border-violet-400 bg-violet-500/15 px-2 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-200" style={{ top: interaction.startMinutes / 60 * hourHeight, height: Math.max(28, (interaction.endMinutes - interaction.startMinutes) / 60 * hourHeight) }}>New block · {dateFromMinutes(dayIndex, interaction.startMinutes).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
        </div>;
      })}
    </div>
  </div></div>;
}

function AgendaView({ anchor, items, onDateSelect, onEdit }: { anchor: Date; items: ScheduleItem[]; onDateSelect: (date: Date) => void; onEdit: (item: ScheduleItem) => void }) {
  const start = startOfWeek(anchor); const grouped = Array.from({ length: 14 }, (_, index) => addDays(start, index));
  return <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">{grouped.map((day) => { const dayItems = items.filter((item) => sameDay(item.start_at, day)); return <div key={dateKey(day)} className="grid gap-4 p-4 md:grid-cols-[150px_1fr]"><button onClick={() => onDateSelect(day)} className="text-left"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{day.toLocaleDateString(undefined, { weekday: "long" })}</p><p className="mt-1 text-lg font-bold">{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p></button><div className="space-y-2">{dayItems.length ? dayItems.map((item) => <AgendaItem key={item.id} item={item} onEdit={item.source === "event" ? () => onEdit(item) : undefined} />) : <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400 dark:border-white/10">Open day — ideal for flexible work or recovery.</div>}</div></div>; })}</div>;
}

function TimelineView({ anchor, items, onEdit }: { anchor: Date; items: ScheduleItem[]; onEdit: (item: ScheduleItem) => void }) {
  const start = startOfWeek(anchor); const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return <div className="overflow-x-auto p-4"><div className="min-w-[900px] space-y-4">{days.map((day) => { const dayItems = items.filter((item) => sameDay(item.start_at, day)).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()); return <div key={dateKey(day)} className="grid grid-cols-[120px_1fr] gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{day.toLocaleDateString(undefined, { weekday: "short" })}</p><p className="mt-1 text-lg font-bold">{day.getDate()}</p></div><div className="relative min-h-20 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.02]"><div className="grid grid-cols-6 text-[9px] font-semibold text-slate-400">{[6,9,12,15,18,21].map((hour) => <span key={hour}>{new Date(2020,1,1,hour).toLocaleTimeString([], { hour: "numeric" })}</span>)}</div><div className="relative mt-3 h-10">{dayItems.map((item) => { const startHour = new Date(item.start_at).getHours() + new Date(item.start_at).getMinutes()/60; const left = Math.max(0, Math.min(100, (startHour - 6) / 18 * 100)); const width = Math.max(4, Math.min(100-left, itemDuration(item) / 60 / 18 * 100)); return <button key={item.id} onClick={() => item.source === "event" && onEdit(item)} title={item.title} className="absolute top-0 h-9 overflow-hidden rounded-lg px-2 text-left text-[10px] font-bold text-white shadow-sm" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: item.color }}><span className="block truncate">{item.title}</span></button>; })}</div></div></div>; })}</div></div>;
}

function SmartMetric({ label, value }: { label: string; value: number | string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>; }
function Stat({ icon: Icon, label, value, detail, warning = false }: { icon: typeof Target; label: string; value: number; detail: string; warning?: boolean }) { return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className={`mt-3 text-3xl font-bold ${warning && value ? "text-rose-600 dark:text-rose-300" : ""}`}>{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"><Icon className="h-5 w-5" /></div></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>; }
function AgendaItem({ item, onEdit, compact = false }: { item: ScheduleItem; onEdit?: () => void; compact?: boolean }) { return <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/[0.07]"><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{item.title}</p><span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${sourceStyle(item.source)}`}>{item.source}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.is_all_day ? "All day" : new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{item.location ? ` · ${item.location}` : ""}</p>{!compact && item.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>}</div>{item.source === "event" && onEdit && <button onClick={onEdit} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"><Pencil className="h-4 w-4" /></button>}</div>; }
