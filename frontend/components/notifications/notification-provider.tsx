"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { getScheduleWorkspace, getUserProfile } from "@/lib/api";
import type { UserProfile } from "@/lib/api";
import type { ScheduleItem } from "@/types/schedule";

const CHECK_INTERVAL_MS = 15_000;
const REFRESH_INTERVAL_MS = 5 * 60_000;
const REMINDER_GRACE_MS = 10 * 60_000;
const SEEN_STORAGE_KEY = "flowmind_seen_notifications";
const NOTIFICATION_CHANGE_EVENT = "flowmind:notification-permission-change";

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

type SeenNotifications = Record<string, number>;

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

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return Object.entries(parsed as Record<string, unknown>).reduce<SeenNotifications>(
      (seen, [key, value]) => {
        if (typeof value === "number" && value >= cutoff) {
          seen[key] = value;
        }

        return seen;
      },
      {},
    );
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
  return profile.email_notifications;
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

export function NotificationProvider() {
  const pathname = usePathname();
  const profileRef = useRef<UserProfile | null>(null);
  const itemsRef = useRef<ScheduleItem[]>([]);
  const seenRef = useRef<SeenNotifications>({});

  const active = Boolean(pathname && !PUBLIC_ROUTES.has(pathname));

  const refreshReminders = useCallback(async () => {
    if (!active) return;

    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 1);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    try {
      const [profile, workspace] = await Promise.all([
        getUserProfile(),
        getScheduleWorkspace(dateKey(rangeStart), dateKey(rangeEnd)),
      ]);

      profileRef.current = profile;
      itemsRef.current = workspace.items.filter((item) => item.reminder_at);
    } catch {
      profileRef.current = null;
      itemsRef.current = [];
    }
  }, [active]);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    seenRef.current = loadSeenNotifications();
    saveSeenNotifications(seenRef.current);
    void refreshReminders();

    const refreshTimer = window.setInterval(() => {
      void refreshReminders();
    }, REFRESH_INTERVAL_MS);

    const handlePermissionChange = () => {
      void refreshReminders();
    };

    window.addEventListener(NOTIFICATION_CHANGE_EVENT, handlePermissionChange);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener(NOTIFICATION_CHANGE_EVENT, handlePermissionChange);
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
          icon: "/favicon.ico",
          tag: marker,
        });

        notification.onclick = () => {
          window.focus();
          window.location.assign(item.source === "task" ? "/tasks" : item.source === "habit" ? "/habits" : "/schedule");
          notification.close();
        };

        seenRef.current[marker] = now;
        changed = true;
      }

      if (changed) saveSeenNotifications(seenRef.current);
    };

    checkDueReminders();
    const timer = window.setInterval(checkDueReminders, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active]);

  return null;
}

export { NOTIFICATION_CHANGE_EVENT };
