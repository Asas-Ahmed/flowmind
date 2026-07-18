"use client";

import { useSyncExternalStore } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

import { NOTIFICATION_CHANGE_EVENT } from "@/components/notifications/notification-provider";

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

export function NotificationButton({ className }: NotificationButtonProps) {
  const permission = useSyncExternalStore(
    subscribeToPermissionChanges,
    readPermission,
    getServerPermission,
  );

  async function handleClick() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
      window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("FlowMind notifications are ready", {
        body: "Task, habit, and schedule reminders can now appear while FlowMind is open.",
        icon: "/favicon.ico",
        tag: "flowmind-notification-test",
      });
    }
  }

  const label =
    permission === "granted"
      ? "Notifications enabled — click to test"
      : permission === "denied"
        ? "Notifications blocked in browser settings"
        : permission === "unsupported"
          ? "Browser notifications are not supported"
          : "Enable browser notifications";

  const Icon =
    permission === "granted"
      ? BellRing
      : permission === "denied" || permission === "unsupported"
        ? BellOff
        : Bell;

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={permission === "denied" || permission === "unsupported"}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-55`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
