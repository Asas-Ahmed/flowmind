"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  CalendarDays,
  Flame,
  LayoutDashboard,
  ListTodo,
  Settings,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";

type NavigationCountKey = "tasks" | "habits";

type NavigationItem = {
  label: string;
  mobileLabel?: string;
  href?: string;
  icon: LucideIcon;
  countKey?: NavigationCountKey;
  mobile?: boolean;
  comingSoon?: boolean;
};

type WorkspaceNavigationProps = {
  variant?: "desktop" | "mobile";
  counts?: Partial<Record<NavigationCountKey, number>>;
  className?: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    mobileLabel: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ListTodo,
    countKey: "tasks",
    mobile: true,
  },
  {
    label: "Habits",
    href: "/habits",
    icon: Flame,
    countKey: "habits",
    mobile: true,
  },
  {
    label: "Focus",
    icon: Timer,
    mobile: true,
    comingSoon: true,
  },
  {
    label: "Schedule",
    icon: CalendarDays,
    comingSoon: true,
  },
  {
    label: "Analytics",
    icon: BarChart3,
    comingSoon: true,
  },
  {
    label: "Flow Assistant",
    mobileLabel: "Assistant",
    icon: Brain,
    mobile: true,
    comingSoon: true,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function isActiveRoute(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceNavigation({
  variant = "desktop",
  counts = {},
  className = "",
}: WorkspaceNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (variant === "mobile") {
    const mobileItems = navigationItems.filter((item) => item.mobile);

    return (
      <nav
        aria-label="Mobile workspace navigation"
        className={`fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[1.65rem] border border-slate-200/80 bg-white/90 p-1.5 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl dark:border-white/10 dark:bg-[#090d1d]/92 dark:shadow-black/40 xl:hidden ${className}`}
      >
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <button
              key={item.label}
              type="button"
              disabled={!item.href}
              onClick={() => {
                if (item.href) {
                  router.push(item.href);
                }
              }}
              aria-current={active ? "page" : undefined}
              aria-label={
                item.comingSoon
                  ? `${item.label}, coming soon`
                  : item.label
              }
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-1 py-2.5 text-[10px] font-semibold transition duration-200 sm:text-xs ${
                active
                  ? "text-white dark:text-slate-950"
                  : item.href
                    ? "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    : "cursor-default text-slate-400 dark:text-slate-600"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="workspace-mobile-active"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                  }}
                  className="absolute inset-0 rounded-2xl bg-slate-950 shadow-lg shadow-slate-950/20 dark:bg-white"
                />
              )}

              <Icon className="relative z-10 h-5 w-5 shrink-0" />

              <span className="relative z-10 max-w-full truncate">
                {item.mobileLabel ?? item.label}
              </span>

              {item.comingSoon && !active && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        aria-label="Open FlowMind dashboard"
        className="mb-5 block rounded-2xl p-1 transition hover:opacity-80"
      >
        <FlowMindLogo size="md" variant="full" href="" />
      </button>

      <div className="border-t border-slate-200/70 pt-5 dark:border-white/10">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Workspace
        </p>

        <nav
          aria-label="Workspace navigation"
          className="space-y-1.5"
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);
            const count = item.countKey
              ? counts[item.countKey]
              : undefined;

            return (
              <button
                key={item.label}
                type="button"
                disabled={!item.href}
                onClick={() => {
                  if (item.href) {
                    router.push(item.href);
                  }
                }}
                aria-current={active ? "page" : undefined}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "text-white shadow-lg shadow-slate-950/15 dark:text-slate-950 dark:shadow-black/20"
                    : item.href
                      ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                      : "cursor-default text-slate-400 dark:text-slate-600"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="workspace-desktop-active"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-2xl bg-slate-950 dark:bg-white"
                  />
                )}

                <span
                  className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl transition duration-200 ${
                    active
                      ? "bg-white/12 dark:bg-slate-950/10"
                      : item.href
                        ? "bg-slate-100 group-hover:scale-105 dark:bg-white/[0.07]"
                        : "bg-slate-100/60 dark:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>

                <span className="relative z-10 min-w-0 flex-1 truncate">
                  {item.label}
                </span>

                {typeof count === "number" && (
                  <span
                    className={`relative z-10 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? "bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950"
                        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}

                {item.comingSoon && (
                  <span className="relative z-10 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:border-violet-400/15 dark:bg-violet-400/10 dark:text-violet-300">
                    Soon
                  </span>
                )}

                {active && (
                  <span className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 dark:bg-indigo-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}