"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { getScheduleWorkspace, getTaskWorkspace, getUserProfile } from "@/lib/api";
import type { UserProfile } from "@/lib/api";
import type { ScheduleItem } from "@/types/schedule";

const CHECK_INTERVAL_MS = 10_000;
const REFRESH_INTERVAL_MS = 30_000;
const REMINDER_GRACE_MS = 15 * 60_000;
const UPCOMING_WINDOW_MS = 7 * 24 * 60 * 60_000;
const SEEN_STORAGE_KEY = "flowmind_seen_notifications";
const BROADCAST_CHANNEL_NAME = "flowmind-notifications";

export const NOTIFICATION_CHANGE_EVENT = "flowmind:notification-permission-change";
export const NOTIFICATION_DATA_CHANGE_EVENT = "flowmind:notification-data-change";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

type SeenNotifications = Record<string, number>;

type NotificationContextValue = {
  reminders: ScheduleItem[];
  unreadCount: number;
  loading: boolean;
  lastUpdatedAt: number | null;
  currentTime: number | null;
  refresh: () => Promise<void>;
  markSeen: (item: ScheduleItem) => void;
  markAllSeen: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function reminderMarker(item: ScheduleItem) {
  return `${item.source}:${item.source_id}:${item.reminder_at ?? item.start_at}`;
}

function loadSeenNotifications(): SeenNotifications {
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cutoff = Date.now() - 14 * 24 * 60 * 60_000;
    const seen: SeenNotifications = {};

    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && value >= cutoff) seen[key] = value;
    }

    return seen;
  } catch {
    return {};
  }
}

function saveSeenNotifications(seen: SeenNotifications) {
  window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
}

function preferenceAllows(item: ScheduleItem, profile: UserProfile) {
  if (item.source === "task") return profile.task_reminders;
  if (item.source === "habit") return profile.habit_reminders;

  // Schedule/browser reminders are not email notifications.
  // If the event itself has a reminder_at value, browser permission controls delivery.
  return true;
}

function notificationCopy(item: ScheduleItem) {
  if (item.source === "task") {
    return { title: "FlowMind task reminder", body: item.title };
  }
  if (item.source === "habit") {
    return { title: "FlowMind habit reminder", body: `Time for ${item.title}.` };
  }
  if (item.source === "focus") {
    return { title: "FlowMind focus reminder", body: item.title };
  }
  return {
    title: "FlowMind schedule reminder",
    body: item.location ? `${item.title} · ${item.location}` : item.title,
  };
}

function destinationFor(item: ScheduleItem) {
  if (item.source === "task") return "/tasks";
  if (item.source === "habit") return "/habits";
  if (item.source === "focus") return "/focus";
  return "/schedule";
}

export function NotificationProvider({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const profileRef = useRef<UserProfile | null>(null);
  const itemsRef = useRef<ScheduleItem[]>([]);
  const seenRef = useRef<SeenNotifications>({});
  const refreshingRef = useRef(false);

  const [reminders, setReminders] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [seenNotifications, setSeenNotifications] = useState<SeenNotifications>({});

  const active = Boolean(pathname && !PUBLIC_ROUTES.has(pathname));

  const refreshReminders = useCallback(async () => {
    if (!active || refreshingRef.current) return;

    refreshingRef.current = true;
    setLoading(true);

    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 1);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    try {
      const [profile, workspace, taskWorkspace] = await Promise.all([
        getUserProfile(),
        getScheduleWorkspace(dateKey(rangeStart), dateKey(rangeEnd)),
        getTaskWorkspace(),
      ]);

      // Do not depend only on the Schedule workspace for task reminders.
      // That workspace is filtered primarily by task due dates, so reminders for
      // tasks without a nearby due date can otherwise be missed completely.
      const taskReminderItems: ScheduleItem[] = taskWorkspace.tasks
        .filter((task) => task.reminder_enabled && task.reminder_at)
        .filter((task) => task.status !== "completed")
        .map((task) => ({
          id: `task-${task.id}`,
          source: "task",
          source_id: task.id,
          title: task.title,
          description: task.description,
          start_at: task.start_at ?? task.due_at ?? task.reminder_at as string,
          end_at: task.due_at,
          is_all_day: task.is_all_day,
          color: "#4a6ded",
          status: task.status,
          reminder_at: task.reminder_at,
          location: null,
        }));

      const mergedItems = [
        ...workspace.items.filter((item) => item.source !== "task"),
        ...taskReminderItems,
      ];

      const nowMs = Date.now();
      const visibleItems = mergedItems
        .filter((item) => item.reminder_at)
        .filter((item) => preferenceAllows(item, profile))
        .filter((item) => !(item.source === "task" && item.status === "completed"))
        .filter((item) => {
          const reminderMs = new Date(item.reminder_at as string).getTime();
          return Number.isFinite(reminderMs) && reminderMs >= nowMs - REMINDER_GRACE_MS && reminderMs <= nowMs + UPCOMING_WINDOW_MS;
        })
        .sort((a, b) => new Date(a.reminder_at as string).getTime() - new Date(b.reminder_at as string).getTime());

      profileRef.current = profile;
      itemsRef.current = visibleItems;
      setReminders(visibleItems);
      setLastUpdatedAt(nowMs);
    } catch {
      profileRef.current = null;
      itemsRef.current = [];
      setReminders([]);
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, [active]);

  const markSeen = useCallback((item: ScheduleItem) => {
    const next = { ...seenRef.current, [reminderMarker(item)]: Date.now() };
    seenRef.current = next;
    saveSeenNotifications(next);
    setSeenNotifications(next);
  }, []);

  const markAllSeen = useCallback(() => {
    const now = Date.now();
    for (const item of itemsRef.current) seenRef.current[reminderMarker(item)] = now;
    const next = { ...seenRef.current };
    seenRef.current = next;
    saveSeenNotifications(next);
    setSeenNotifications(next);
  }, []);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const initialize = window.setTimeout(() => {
      const seen = loadSeenNotifications();
      seenRef.current = seen;
      saveSeenNotifications(seen);
      setSeenNotifications(seen);
      setCurrentTime(Date.now());
      void refreshReminders();
    }, 0);

    const channel = "BroadcastChannel" in window
      ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      : null;

    const requestRefresh = () => void refreshReminders();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestRefresh();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SEEN_STORAGE_KEY) {
        const seen = loadSeenNotifications();
        seenRef.current = seen;
        setSeenNotifications(seen);
      }
    };
    const handleDataChange = () => {
      channel?.postMessage("refresh");
      requestRefresh();
    };

    channel?.addEventListener("message", requestRefresh);
    window.addEventListener(NOTIFICATION_CHANGE_EVENT, requestRefresh);
    window.addEventListener(NOTIFICATION_DATA_CHANGE_EVENT, handleDataChange);
    window.addEventListener("focus", requestRefresh);
    window.addEventListener("online", requestRefresh);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    const refreshTimer = window.setInterval(requestRefresh, REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialize);
      window.clearInterval(refreshTimer);
      channel?.removeEventListener("message", requestRefresh);
      channel?.close();
      window.removeEventListener(NOTIFICATION_CHANGE_EVENT, requestRefresh);
      window.removeEventListener(NOTIFICATION_DATA_CHANGE_EVENT, handleDataChange);
      window.removeEventListener("focus", requestRefresh);
      window.removeEventListener("online", requestRefresh);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active, refreshReminders]);

  useEffect(() => {
    if (!active || typeof window === "undefined" || !("Notification" in window)) return;

    const checkDueReminders = () => {
      if (Notification.permission !== "granted" || !profileRef.current) return;

      const now = Date.now();
      let changed = false;

      for (const item of itemsRef.current) {
        if (!item.reminder_at || !preferenceAllows(item, profileRef.current)) continue;
        if (item.source === "task" && item.status === "completed") continue;

        const reminderTime = new Date(item.reminder_at).getTime();
        if (!Number.isFinite(reminderTime)) continue;
        if (reminderTime > now || now - reminderTime > REMINDER_GRACE_MS) continue;

        const marker = reminderMarker(item);
        if (seenRef.current[marker]) continue;

        const copy = notificationCopy(item);
        const notification = new Notification(copy.title, {
          body: copy.body,
          icon: "/brand/flowmind-icon-192.png",
          badge: "/brand/flowmind-icon-192.png",
          tag: marker,
          requireInteraction: item.source === "task",
        });

        notification.onclick = () => {
          window.focus();
          window.location.assign(destinationFor(item));
          notification.close();
        };

        seenRef.current[marker] = now;
        changed = true;
      }

      if (changed) {
        const next = { ...seenRef.current };
        seenRef.current = next;
        saveSeenNotifications(next);
        setSeenNotifications(next);
      }
    };

    const initialCheck = window.setTimeout(checkDueReminders, 0);
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
      checkDueReminders();
    }, CHECK_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(timer);
    };
  }, [active]);

  const unreadCount = useMemo(() => {
    if (currentTime === null) return 0;
    return reminders.filter((item) => {
      const reminderTime = new Date(item.reminder_at as string).getTime();
      return reminderTime <= currentTime && !seenNotifications[reminderMarker(item)];
    }).length;
  }, [currentTime, reminders, seenNotifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      reminders,
      unreadCount,
      loading,
      lastUpdatedAt,
      currentTime,
      refresh: refreshReminders,
      markSeen,
      markAllSeen,
    }),
    [reminders, unreadCount, loading, lastUpdatedAt, currentTime, refreshReminders, markSeen, markAllSeen],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider.");
  return context;
}

export function notifyNotificationDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATION_DATA_CHANGE_EVENT));
  }
}
