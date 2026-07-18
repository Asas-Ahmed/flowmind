"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  BellRing,
  CalendarClock,
  CheckCheck,
  Clock3,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import {
  NOTIFICATION_CHANGE_EVENT,
  useNotifications,
} from "@/components/notifications/notification-provider";
import type { ScheduleItem } from "@/types/schedule";

type PermissionState = NotificationPermission | "unsupported";

type NotificationButtonProps = {
  className: string;
};

function readPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function subscribeToPermissionChanges(onStoreChange: () => void) {
  window.addEventListener(NOTIFICATION_CHANGE_EVENT, onStoreChange);
  window.addEventListener("focus", onStoreChange);
  return () => {
    window.removeEventListener(NOTIFICATION_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

function getServerPermission(): PermissionState {
  return "default";
}

function destinationFor(item: ScheduleItem) {
  if (item.source === "task") return "/tasks";
  if (item.source === "habit") return "/habits";
  if (item.source === "focus") return "/focus";
  return "/schedule";
}

function formatReminderTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(undefined, {
    ...(sameDay ? {} : { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function NotificationButton({ className }: NotificationButtonProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const permission = useSyncExternalStore(
    subscribeToPermissionChanges,
    readPermission,
    getServerPermission,
  );
  const {
    reminders,
    unreadCount,
    loading,
    lastUpdatedAt,
    currentTime,
    refresh,
    markSeen,
    markAllSeen,
  } = useNotifications();

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
      window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
      await refresh();
    }
  }

  function openReminder(item: ScheduleItem) {
    markSeen(item);
    setOpen(false);
    router.push(destinationFor(item));
  }

  const Icon = permission === "granted" ? BellRing : permission === "denied" || permission === "unsupported" ? BellOff : Bell;
  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${className} relative`}
        aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        title="Notifications"
      >
        <Icon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-[#090d18]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-20 z-[100] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-[#0a0f1d] sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-white/10">
            <div>
              <p className="font-black text-slate-950 dark:text-white">Notifications</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Live reminders while FlowMind is open
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => void refresh()} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Refresh reminders" title="Refresh">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close notifications">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {permission === "default" && (
            <button onClick={() => void enableNotifications()} className="m-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-left text-white hover:bg-indigo-500">
              <BellRing className="h-5 w-5 shrink-0" />
              <span><span className="block text-sm font-bold">Enable browser alerts</span><span className="block text-xs text-indigo-100">Receive task, habit, and schedule reminders.</span></span>
            </button>
          )}

          {(permission === "denied" || permission === "unsupported") && (
            <div className="m-3 flex items-start gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-300">
              <BellOff className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-xs leading-5">Browser alerts are blocked or unsupported. In-app reminders will still appear here.</p>
            </div>
          )}

          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Upcoming and due</p>
            {unreadCount > 0 && <button onClick={markAllSeen} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-cyan-300"><CheckCheck className="h-3.5 w-3.5" />Mark all read</button>}
          </div>

          <div className="max-h-[420px] overflow-y-auto px-2 pb-2">
            {loading && reminders.length === 0 ? (
              <div className="grid min-h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
            ) : reminders.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CalendarClock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-bold">No upcoming reminders</p>
                <p className="mt-1 text-xs text-slate-500">Task, habit, and schedule reminders will appear here.</p>
              </div>
            ) : reminders.map((item) => {
              const reminderTime = new Date(item.reminder_at as string).getTime();
              const due = currentTime !== null && reminderTime <= currentTime;
              return (
                <button key={item.id} onClick={() => openReminder(item)} className="mb-1 flex w-full gap-3 rounded-2xl px-3 py-3 text-left hover:bg-slate-100 dark:hover:bg-white/[0.06]">
                  <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${due ? "bg-rose-500/10 text-rose-500" : "bg-indigo-500/10 text-indigo-500 dark:text-cyan-300"}`}>
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="capitalize">{item.source}</span><span>•</span><span>{due ? "Due " : ""}{formatReminderTime(item.reminder_at as string)}</span></span>
                  </span>
                  {due && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200/80 px-4 py-3 text-[11px] text-slate-400 dark:border-white/10">
            {lastUpdatedAt ? `Updated ${new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Waiting for reminder data"}
          </div>
        </div>
      )}
    </div>
  );
}
