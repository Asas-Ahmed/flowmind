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
  showBrand?: boolean;
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
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceNavigation({
  variant = "desktop",
  counts = {},
  className = "",
  showBrand = true,
}: WorkspaceNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (variant === "mobile") {
    const mobileItems = navigationItems.filter((item) => item.mobile);

    return (
      <nav
        aria-label="Mobile workspace navigation"
        className={`fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-black/40 xl:hidden ${className}`}
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
                item.comingSoon ? `${item.label}, coming soon` : item.label
              }
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-colors duration-200 sm:text-xs ${
                active
                  ? "text-white"
                  : item.href
                    ? "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    : "cursor-default text-slate-300 dark:text-slate-700"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="workspace-mobile-active"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                  }}
                  className="absolute inset-0 rounded-xl bg-slate-950 shadow-sm dark:bg-slate-100"
                />
              )}

              <Icon
                className={`relative z-10 h-5 w-5 shrink-0 ${
                  active ? "dark:text-slate-950" : ""
                }`}
              />

              <span
                className={`relative z-10 max-w-full truncate ${
                  active ? "dark:text-slate-950" : ""
                }`}
              >
                {item.mobileLabel ?? item.label}
              </span>

              {item.comingSoon && !active && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className={className}>
      {showBrand && (
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Open FlowMind dashboard"
          className="mb-5 block rounded-xl p-1 transition-opacity hover:opacity-80"
        >
          <FlowMindLogo size="md" variant="full" href="" />
        </button>
      )}

      <div
        className={
          showBrand
            ? "border-t border-slate-200/80 pt-5 dark:border-white/[0.08]"
            : ""
        }
      >
        <div className="mb-2.5 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Workspace
          </p>
        </div>

        <nav aria-label="Workspace navigation" className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);
            const count = item.countKey ? counts[item.countKey] : undefined;

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
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "text-slate-950 dark:text-white"
                    : item.href
                      ? "text-slate-600 hover:bg-slate-100/90 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.055] dark:hover:text-white"
                      : "cursor-default text-slate-300 dark:text-slate-600"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="workspace-desktop-active"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                    }}
                    className="absolute inset-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.09] dark:bg-white/[0.07]"
                  />
                )}

                {active && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-blue-600 dark:bg-blue-400" />
                )}

                <span
                  className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors duration-200 ${
                    active
                      ? "border-slate-200 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
                      : item.href
                        ? "border-transparent bg-slate-100/80 text-slate-500 group-hover:bg-white group-hover:text-slate-800 dark:bg-white/[0.045] dark:text-slate-500 dark:group-hover:bg-white/[0.08] dark:group-hover:text-slate-200"
                        : "border-transparent bg-slate-100/40 text-slate-300 dark:bg-white/[0.02] dark:text-slate-700"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>

                <span className="relative z-10 min-w-0 flex-1 truncate">
                  {item.label}
                </span>

                {typeof count === "number" && (
                  <span
                    className={`relative z-10 min-w-6 rounded-md px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
                      active
                        ? "bg-slate-100 text-slate-700 dark:bg-white/[0.09] dark:text-slate-200"
                        : "bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-500"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}

                {item.comingSoon && (
                  <span className="relative z-10 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
