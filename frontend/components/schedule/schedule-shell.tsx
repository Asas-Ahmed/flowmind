"use client";

import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  createScheduleEvent,
  deleteScheduleEvent,
  getScheduleWorkspace,
  updateScheduleEvent,
} from "@/lib/api";
import type {
  ScheduleEvent,
  ScheduleEventPayload,
  ScheduleEventType,
  ScheduleItem,
  ScheduleWorkspace,
} from "@/types/schedule";

const EVENT_COLORS = ["#4a6ded", "#762bbc", "#cf4de1", "#0ea5e9", "#10b981", "#f59e0b"];
const EVENT_TYPES: ScheduleEventType[] = ["event", "meeting", "study", "focus", "personal"];

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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [workspace, setWorkspace] = useState<ScheduleWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [form, setForm] = useState<ScheduleEventPayload>(() => initialForm());
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

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, ScheduleItem[]>();
    for (const item of workspace?.items ?? []) {
      const key = dateKey(item.start_at);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return grouped;
  }, [workspace]);

  const selectedItems = itemsByDate.get(dateKey(selectedDate)) ?? [];
  const upcomingItems = (workspace?.items ?? [])
    .filter((item) => new Date(item.start_at).getTime() >= mountedAt)
    .slice(0, 5);

  function openCreate(date = selectedDate) {
    setEditing(null);
    setForm(initialForm(date));
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
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><ChevronLeft className="h-5 w-5" /></button>
                <div className="text-center"><p className="text-lg font-bold">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p><button onClick={() => { const today = new Date(); setMonth(today); setSelectedDate(today); }} className="text-xs font-semibold text-blue-600 dark:text-blue-400">Jump to today</button></div>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.025]">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-3">{day}</div>)}</div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const key = dateKey(day);
                  const items = itemsByDate.get(key) ?? [];
                  const selected = key === dateKey(selectedDate);
                  const today = key === dateKey(new Date());
                  const muted = day.getMonth() !== month.getMonth();
                  return <button key={key} onClick={() => setSelectedDate(day)} onDoubleClick={() => openCreate(day)} className={`min-h-28 border-b border-r border-slate-100 p-2 text-left transition dark:border-white/[0.06] sm:min-h-32 ${selected ? "bg-blue-50/70 dark:bg-blue-400/[0.07]" : "hover:bg-slate-50 dark:hover:bg-white/[0.025]"}`}><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${today ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : muted ? "text-slate-300 dark:text-slate-700" : "text-slate-600 dark:text-slate-300"}`}>{day.getDate()}</span><div className="mt-2 space-y-1">{items.slice(0, 3).map((item) => <div key={item.id} className="truncate rounded-md px-1.5 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: item.color }}>{item.is_all_day ? "" : new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · "}{item.title}</div>)}{items.length > 3 && <p className="px-1 text-[10px] font-semibold text-slate-400">+{items.length - 3} more</p>}</div></button>;
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]">
                <div className="flex items-center justify-between"><div><p className="text-sm font-bold">{selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedItems.length} scheduled items</p></div><button onClick={() => openCreate(selectedDate)} className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"><Plus className="h-4 w-4" /></button></div>
                <div className="mt-4 space-y-3">{selectedItems.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-white/10">Nothing scheduled yet.</div> : selectedItems.map((item) => <AgendaItem key={item.id} item={item} onEdit={() => { const event = workspace?.events.find((entry) => entry.id === item.source_id); if (event) openEdit(event); }} />)}</div>
              </div>

              <div className="rounded-[26px] border border-blue-200/70 bg-gradient-to-br from-blue-50 to-violet-50 p-5 dark:border-blue-400/15 dark:from-blue-500/10 dark:to-violet-500/10"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-300"><Sparkles className="h-5 w-5" /></div><div><p className="text-sm font-bold">Flow Assistant</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{workspace?.overdue_count ? `You have ${workspace.overdue_count} overdue task${workspace.overdue_count === 1 ? "" : "s"}. Clear one before adding more work.` : selectedItems.length > 5 ? "This day looks busy. Protect at least one break between demanding blocks." : "Your schedule has healthy space. Add one focused priority and keep the rest flexible."}</p></div></div></div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]"><p className="text-sm font-bold">Next up</p><div className="mt-4 space-y-3">{upcomingItems.length === 0 ? <p className="text-sm text-slate-400">No upcoming items.</p> : upcomingItems.map((item) => <AgendaItem key={item.id} item={item} compact />)}</div></div>
            </div>
          </section>
        </div>
      </motion.main>

      <WorkspaceNavigation variant="mobile" />

      {modalOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl dark:bg-[#0b0f19]"><div className="flex items-center justify-between"><div><p className="text-lg font-bold">{editing ? "Edit event" : "Create event"}</p><p className="mt-1 text-xs text-slate-500">Add a dedicated time block to your FlowMind schedule.</p></div><button onClick={() => setModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-4"><Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Deep work, class, meeting..." /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Type"><select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as ScheduleEventType })} className="input cursor-pointer capitalize">{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Location"><input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value || null })} className="input" placeholder="Optional" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Starts"><input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="input cursor-pointer" /></Field><Field label="Ends"><input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className="input cursor-pointer" /></Field></div><Field label="Description"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value || null })} rows={3} className="input resize-none" placeholder="Optional notes" /></Field><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Color</p><div className="flex gap-2">{EVENT_COLORS.map((color) => <button key={color} onClick={() => setForm({ ...form, color })} className={`h-8 w-8 rounded-full border-4 ${form.color === color ? "border-slate-950 dark:border-white" : "border-transparent"}`} style={{ backgroundColor: color }} />)}</div></div><div className="grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={form.is_all_day} onChange={(e) => setForm({ ...form, is_all_day: e.target.checked })} /> All-day event</label><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={form.reminder_enabled} onChange={(e) => setForm({ ...form, reminder_enabled: e.target.checked })} /> Reminder enabled</label></div>{form.reminder_enabled && <Field label="Remind before"><select value={form.reminder_minutes_before} onChange={(e) => setForm({ ...form, reminder_minutes_before: Number(e.target.value) })} className="input cursor-pointer"><option value={0}>At start time</option><option value={5}>5 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={1440}>1 day</option></select></Field>}</div><div className="mt-6 flex items-center justify-between gap-3">{editing ? <button disabled={busy} onClick={() => void removeEvent(editing.id)} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10"><Trash2 className="h-4 w-4" /> Delete</button> : <span />}<button disabled={busy} onClick={() => void saveEvent()} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{busy ? "Saving..." : editing ? "Save changes" : "Create event"}</button></div></div></div>}
      <style jsx global>{` .input { width: 100%; border-radius: 1rem; border: 1px solid rgb(226 232 240); background: rgb(248 250 252); color: rgb(15 23 42); padding: 0.75rem 1rem; font-size: 0.875rem; outline: none; appearance: none; transition: border-color .2s, background-color .2s, color .2s; } .dark .input { border-color: rgba(255,255,255,.10); background: rgb(15 23 42); /* slate-900 */ color: rgb(248 250 252); } .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,.12); } /* Fix dropdown menu in dark mode */ .dark select.input option { background: rgb(15 23 42); color: rgb(248 250 252); } .dark select.input optgroup { background: rgb(15 23 42); color: rgb(248 250 252); } `}</style>
    </div>
  );
}

function Stat({ icon: Icon, label, value, detail, warning = false }: { icon: typeof Target; label: string; value: number; detail: string; warning?: boolean }) { return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.09] dark:bg-[#0a0e1a]"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className={`mt-3 text-3xl font-bold ${warning && value ? "text-rose-600 dark:text-rose-300" : ""}`}>{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"><Icon className="h-5 w-5" /></div></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>{children}</label>; }
function AgendaItem({ item, onEdit, compact = false }: { item: ScheduleItem; onEdit?: () => void; compact?: boolean }) { return <div className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/[0.07]"><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{item.title}</p><span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${sourceStyle(item.source)}`}>{item.source}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.is_all_day ? "All day" : new Date(item.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{item.location ? ` · ${item.location}` : ""}</p>{!compact && item.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>}</div>{item.source === "event" && onEdit && <button onClick={onEdit} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"><Pencil className="h-4 w-4" /></button>}</div>; }
