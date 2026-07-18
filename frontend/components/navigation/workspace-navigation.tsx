"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  Gauge,
  Brain,
  CalendarDays,
  CalendarRange,
  Clock3,
  BellOff,
  BrainCircuit,
  Flame,
  GitBranchPlus,
  Eye,
  FlaskConical,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  PersonStanding,
  Footprints,
  Settings,
  ShieldAlert,
  MoonStar,
  CupSoda,
  HeartPulse,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
    href: "/focus",
    icon: Timer,
    mobile: true,
  },
  {
    label: "Weekly Review",
    href: "/weekly-review",
    icon: CalendarRange,
  },
  {
    label: "Activity Timeline",
    href: "/activity",
    icon: Activity,
  },
  {
    label: "Time Tracking",
    href: "/time-tracking",
    icon: Clock3,
  },
  {
    label: "Schedule",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    label: "Movement",
    href: "/movement",
    icon: PersonStanding,
  },
  {
    label: "Energy Check-In",
    href: "/energy",
    icon: BatteryCharging,
  },
  {
    label: "Sleep",
    href: "/sleep",
    icon: MoonStar,
  },
  {
    label: "Cognitive Load",
    href: "/cognitive-load",
    icon: BrainCircuit,
  },
  {
    label: "If–Then Planner",
    href: "/if-then",
    icon: GitBranchPlus,
  },
  {
    label: "Distraction Log",
    href: "/distractions",
    icon: BellOff,
  },
  {
    label: "Start Small",
    href: "/procrastination",
    icon: Footprints,
  },
  {
    label: "Experiments",
    href: "/experiments",
    icon: FlaskConical,
  },
  {
    label: "Workload Warning",
    href: "/burnout",
    icon: ShieldAlert,
  },
  {
    label: "Hydration & Meals",
    href: "/nourishment",
    icon: CupSoda,
  },
  {
    label: "Recovery Breaks",
    href: "/recovery",
    icon: HeartPulse,
  },
  {
    label: "Eye Care",
    href: "/eye-care",
    icon: Eye,
  },
  {
    label: "Productivity",
    href: "/productivity",
    icon: Gauge,
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
  const [moreOpen, setMoreOpen] = useState(false);

  if (variant === "mobile") {
    const primaryItems = ["Dashboard", "Tasks", "Habits", "Focus"]
      .map((label) => navigationItems.find((item) => item.label === label))
      .filter((item): item is NavigationItem => Boolean(item));
    const moreItems = navigationItems.filter((item) =>
      ["Weekly Review", "Activity Timeline", "Time Tracking", "Schedule", "Movement", "Energy Check-In", "Sleep", "Cognitive Load", "If–Then Planner", "Distraction Log", "Start Small", "Experiments", "Workload Warning", "Hydration & Meals", "Recovery Breaks", "Eye Care", "Productivity", "Analytics", "Flow Assistant", "Settings"].includes(
        item.label,
      ),
    );
    const moreActive = moreItems.some((item) =>
      isActiveRoute(pathname, item.href),
    );

    const navigateTo = (href?: string) => {
      if (!href) return;
      setMoreOpen(false);
      router.push(href);
    };

    return (
      <>
        {moreOpen && (
          <div className="fixed inset-0 z-[60] xl:hidden">
            <button
              type="button"
              aria-label="Close tools menu"
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-x-3 bottom-[92px] flex max-h-[calc(100dvh-116px)] flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-black/60"
            >
              <div className="flex items-center justify-between px-2 pb-3 pt-1">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">
                    More tools
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Open the rest of your FlowMind workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Close tools menu"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="grid min-h-0 grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(pathname, item.href);

                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={!item.href}
                      onClick={() => navigateTo(item.href)}
                      className="relative flex min-h-[88px] items-start gap-3 rounded-2xl p-3 text-left transition"
                    >
                      <span
                        className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          active
                            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                            : item.href
                              ? "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
                              : "bg-slate-100/60 text-slate-300 dark:bg-white/[0.025] dark:text-slate-700"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="relative z-10 min-w-0 pt-0.5">
                        <span
                          className={`block truncate text-sm font-bold ${
                            item.href
                              ? "text-slate-800 dark:text-slate-100"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {item.comingSoon ? "Coming soon" : "Open tool"}
                        </span>
                      </span>
                      <span
                        className={`pointer-events-none absolute inset-0 rounded-2xl border ${
                          active
                            ? "border-blue-300 bg-blue-50/50 dark:border-blue-400/25 dark:bg-blue-400/[0.07]"
                            : item.href
                              ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:hover:border-white/[0.14] dark:hover:bg-white/[0.035]"
                              : "border-slate-100 dark:border-white/[0.04]"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        <nav
          aria-label="Mobile workspace navigation"
          className={`fixed inset-x-3 bottom-3 z-[70] grid grid-cols-5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-black/40 xl:hidden ${className}`}
        >
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigateTo(item.href)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-colors duration-200 sm:text-xs ${
                  active
                    ? "text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="workspace-mobile-active"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-slate-950 shadow-sm dark:bg-slate-100"
                  />
                )}
                <Icon className={`relative z-10 h-5 w-5 ${active ? "dark:text-slate-950" : ""}`} />
                <span className={`relative z-10 max-w-full truncate ${active ? "dark:text-slate-950" : ""}`}>
                  {item.mobileLabel ?? item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-label="Open more FlowMind tools"
            className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-colors duration-200 sm:text-xs ${
              moreOpen || moreActive
                ? "text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            }`}
          >
            {(moreOpen || moreActive) && (
              <motion.span
                layoutId="workspace-mobile-active"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-slate-950 shadow-sm dark:bg-slate-100"
              />
            )}
            <MoreHorizontal className={`relative z-10 h-5 w-5 ${(moreOpen || moreActive) ? "dark:text-slate-950" : ""}`} />
            <span className={`relative z-10 ${(moreOpen || moreActive) ? "dark:text-slate-950" : ""}`}>
              More
            </span>
          </button>
        </nav>
      </>
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
