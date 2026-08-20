"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationButton } from "@/components/notifications/notification-button";
import { WorkspaceTimerDock } from "@/components/navigation/workspace-timer-dock";
import { logoutUser } from "@/lib/api";

type WorkspaceTopbarProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centerContent?: ReactNode;
  actions?: ReactNode;
  maxWidth?: string;
  showSettings?: boolean;
  showLogout?: boolean;
  showMobileLogo?: boolean;
};

const iconButtonClass =
  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border " +
  "border-slate-200/80 bg-white/80 text-slate-600 shadow-sm " +
  "transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 " +
  "hover:bg-white hover:text-slate-950 hover:shadow-md " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 " +
  "dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 " +
  "dark:hover:border-white/20 dark:hover:bg-white/[0.09] dark:hover:text-white";

export function WorkspaceTopbar({
  eyebrow,
  title,
  description,
  centerContent,
  actions,
  maxWidth = "max-w-[1800px]",
  showSettings = true,
  showLogout = true,
  showMobileLogo = true,
}: WorkspaceTopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      sessionStorage.removeItem("flowmind-dashboard-loader-seen");
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-slate-50/80 px-4 py-3 shadow-sm shadow-slate-950/[0.025] backdrop-blur-2xl dark:border-white/10 dark:bg-[#050711]/80 dark:shadow-black/10 sm:px-6 lg:px-8">
      <div
        className={`mx-auto flex ${maxWidth} min-w-0 items-center gap-3 lg:gap-5`}
      >
        {showMobileLogo && (
          <div className="shrink-0 xl:hidden">
            <FlowMindLogo
              variant="mark"
              size="sm"
              href=""
              showSubtitle={false}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-cyan-300 sm:text-xs">
            {eyebrow}
          </p>

          <h1 className="mt-0.5 line-clamp-2 text-base font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-xl lg:text-2xl">
            {title}
          </h1>

          {description && (
            <p className="mt-0.5 hidden truncate text-sm text-slate-500 dark:text-slate-400 lg:block">
              {description}
            </p>
          )}
        </div>

        {centerContent && (
          <div className="hidden min-w-0 flex-1 lg:block">
            {centerContent}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {actions}

          <NotificationButton className={iconButtonClass} />

          <ThemeToggle />

          {showSettings && (
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className={`${iconButtonClass} hidden sm:grid`}
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          {showLogout && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-3 text-sm font-semibold text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:border-rose-400/20 dark:hover:bg-rose-400/10 dark:hover:text-rose-300 sm:flex sm:px-4"
              aria-label="Log out"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden 2xl:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {centerContent && (
        <div className={`mx-auto mt-3 ${maxWidth} lg:hidden`}>
          {centerContent}
        </div>
      )}
    </header>
    <WorkspaceTimerDock />
    </>
  );
}