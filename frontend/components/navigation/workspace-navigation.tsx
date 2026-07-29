"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  BellOff,
  Brain,
  BrainCircuit,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ChevronDown,
  CircleGauge,
  Clock3,
  CupSoda,
  Eye,
  Flame,
  FlaskConical,
  FolderTree,
  Footprints,
  Gauge,
  GitBranchPlus,
  Grid3X3,
  HeartPulse,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  MoonStar,
  PersonStanding,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { useFeaturePreferences } from "@/lib/feature-preferences";

type NavigationCountKey = "tasks" | "habits";
type NavigationGroupId = "core" | "plan" | "insights" | "wellbeing" | "growth" | "system";

type NavigationItem = {
  label: string;
  mobileLabel?: string;
  href: string;
  icon: LucideIcon;
  countKey?: NavigationCountKey;
  description: string;
};

type NavigationGroup = {
  id: NavigationGroupId;
  label: string;
  description: string;
  icon: LucideIcon;
  items: NavigationItem[];
  collapsible?: boolean;
};

type WorkspaceNavigationProps = {
  variant?: "desktop" | "mobile";
  counts?: Partial<Record<NavigationCountKey, number>>;
  className?: string;
  showBrand?: boolean;
};

const navigationGroups: NavigationGroup[] = [
  {
    id: "core",
    label: "Everyday",
    description: "Your essential daily workspace",
    icon: Sparkles,
    items: [
      { label: "Dashboard", mobileLabel: "Home", href: "/dashboard", icon: LayoutDashboard, description: "Today at a glance" },
      { label: "Tasks", href: "/tasks", icon: ListTodo, countKey: "tasks", description: "Capture and complete work" },
      { label: "Habits", href: "/habits", icon: Flame, countKey: "habits", description: "Build consistent routines" },
      { label: "Focus", href: "/focus", icon: Timer, description: "Start a focused session" },
      { label: "Schedule", href: "/schedule", icon: CalendarDays, description: "Plan your time" },
    ],
  },
  {
    id: "plan",
    label: "Plan & Organize",
    description: "Turn intentions into a realistic plan",
    icon: CalendarRange,
    collapsible: true,
    items: [
      { label: "Goals & Targets", href: "/goals", icon: Target, description: "Set weekly outcomes" },
      { label: "Time Budget", href: "/time-budget", icon: Scale, description: "Allocate your weekly time" },
      { label: "Time Tracking", href: "/time-tracking", icon: Clock3, description: "Track where time goes" },
      { label: "Work Categories", href: "/work-categories", icon: FolderTree, description: "Organize areas of work" },
      { label: "If–Then Planner", href: "/if-then", icon: GitBranchPlus, description: "Prepare for obstacles" },
      { label: "Start Small", href: "/procrastination", icon: Footprints, description: "Break through task resistance" },
    ],
  },
  {
    id: "insights",
    label: "Insights & Coaching",
    description: "Understand patterns and choose what to do next",
    icon: BarChart3,
    collapsible: true,
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, description: "Explore all performance insights" },
      { label: "Productivity", href: "/productivity", icon: Gauge, description: "Review your productivity score" },
      { label: "Deep Work", href: "/deep-work", icon: Waves, description: "Analyze focus quality" },
      { label: "Productivity Heatmap", href: "/productivity-heatmap", icon: Grid3X3, description: "See long-term consistency" },
      { label: "Weekly Review", href: "/weekly-review", icon: CalendarRange, description: "Reflect and reset each week" },
      { label: "AI Weekly Coach", href: "/weekly-coach", icon: Brain, description: "Get a weekly coaching summary" },
      { label: "Recommendations", href: "/recommendations", icon: BrainCircuit, description: "Choose your best next action" },
      { label: "Personal Patterns", href: "/personal-patterns", icon: ChartNoAxesCombined, description: "Discover how you work best" },
      { label: "Activity Timeline", href: "/activity", icon: Activity, description: "Review recent activity" },
    ],
  },
  {
    id: "wellbeing",
    label: "Energy & Wellbeing",
    description: "Protect energy while staying productive",
    icon: HeartPulse,
    collapsible: true,
    items: [
      { label: "Life Balance", href: "/life-balance", icon: CircleGauge, description: "Balance important life areas" },
      { label: "Movement", href: "/movement", icon: PersonStanding, description: "Take healthy movement breaks" },
      { label: "Energy Check-In", href: "/energy", icon: BatteryCharging, description: "Match work to your energy" },
      { label: "Sleep", href: "/sleep", icon: MoonStar, description: "Track sleep regularity" },
      { label: "Cognitive Load", href: "/cognitive-load", icon: BrainCircuit, description: "Notice mental overload" },
      { label: "Workload Warning", href: "/burnout", icon: ShieldAlert, description: "Spot unsustainable workload" },
      { label: "Hydration & Meals", href: "/nourishment", icon: CupSoda, description: "Support daily nourishment" },
      { label: "Recovery Breaks", href: "/recovery", icon: HeartPulse, description: "Take a guided reset" },
      { label: "Eye Care", href: "/eye-care", icon: Eye, description: "Follow the 20-20-20 rule" },
    ],
  },
  {
    id: "growth",
    label: "Improve & Experiment",
    description: "Test strategies and reduce distractions",
    icon: FlaskConical,
    collapsible: true,
    items: [
      { label: "Distraction Log", href: "/distractions", icon: BellOff, description: "Identify interruption patterns" },
      { label: "Habit Breaker", href: "/habit-breaker", icon: ShieldCheck, description: "Break unwanted habits and track recovery" },
      { label: "Experiments", href: "/experiments", icon: FlaskConical, description: "Test productivity methods" },
    ],
  },
  {
    id: "system",
    label: "Account",
    description: "Preferences and account controls",
    icon: Settings,
    items: [{ label: "Settings", href: "/settings", icon: Settings, description: "Personalize FlowMind" }],
  },
];


function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavigationItem({
  item,
  active,
  count,
  onNavigate,
  activeItemRef,
}: {
  item: NavigationItem;
  active: boolean;
  count?: number;
  onNavigate: (href: string) => void;
  activeItemRef?: RefObject<HTMLButtonElement | null>;
}) {
  const Icon = item.icon;

  return (
    <button
      ref={active ? activeItemRef : undefined}
      type="button"
      onClick={() => onNavigate(item.href)}
      aria-current={active ? "page" : undefined}
      title={item.description}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ${
        active
          ? "text-slate-950 dark:text-white"
          : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.055] dark:hover:text-white"
      }`}
    >
      {active && (
        <motion.span
          layoutId="workspace-desktop-active"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute inset-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.09] dark:bg-white/[0.07]"
        />
      )}
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-blue-600 dark:bg-blue-400" />}

      <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors duration-200 ${
        active
          ? "border-slate-200 bg-slate-100 text-slate-950 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
          : "border-transparent bg-slate-100/80 text-slate-500 group-hover:bg-white group-hover:text-slate-800 dark:bg-white/[0.045] dark:text-slate-500 dark:group-hover:bg-white/[0.08] dark:group-hover:text-slate-200"
      }`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>

      <span className="relative z-10 min-w-0 flex-1 truncate">{item.label}</span>
      {typeof count === "number" && (
        <span className="relative z-10 min-w-6 rounded-md bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
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
  const { isFeatureEnabled } = useFeaturePreferences();
  const visibleNavigationGroups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => isFeatureEnabled(item.href)),
        }))
        .filter((group) => group.items.length > 0),
    [isFeatureEnabled],
  );
  const visibleNavigationItems = useMemo(
    () => visibleNavigationGroups.flatMap((group) => group.items),
    [visibleNavigationGroups],
  );
  const activeDesktopItemRef = useRef<HTMLButtonElement>(null);

  const activeGroupId = useMemo(
    () => visibleNavigationGroups.find((group) => group.items.some((item) => isActiveRoute(pathname, item.href)))?.id,
    [pathname, visibleNavigationGroups],
  );

  const [openGroups, setOpenGroups] = useState<NavigationGroupId[]>(() =>
    activeGroupId && !["core", "system"].includes(activeGroupId) ? [activeGroupId] : [],
  );

  useEffect(() => {
    if (variant !== "desktop") return;

    const scrollActiveItemIntoView = () => {
      const activeItem = activeDesktopItemRef.current;
      const scrollContainer = activeItem?.closest<HTMLElement>(".workspace-sidebar-scroll");

      if (!activeItem || !scrollContainer) return;

      const itemRect = activeItem.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const safeTop = containerRect.top + 20;
      const safeBottom = containerRect.bottom - 20;

      if (itemRect.top < safeTop || itemRect.bottom > safeBottom) {
        const nextScrollTop =
          scrollContainer.scrollTop +
          itemRect.top -
          containerRect.top -
          (scrollContainer.clientHeight - itemRect.height) / 2;

        scrollContainer.scrollTo({
          top: Math.max(0, nextScrollTop),
          behavior: "smooth",
        });
      }
    };

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollActiveItemIntoView);
    });
    const animationTimer = window.setTimeout(scrollActiveItemIntoView, 240);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(animationTimer);
    };
  }, [activeGroupId, pathname, variant]);

  const navigateTo = (href: string) => {
    setMoreOpen(false);
    router.push(href);
  };

  if (variant === "mobile") {
    const primaryLabels = ["Dashboard", "Tasks", "Habits", "Focus"];
    const primaryItems = primaryLabels
      .map((label) => visibleNavigationItems.find((item) => item.label === label))
      .filter((item): item is NavigationItem => Boolean(item));
    const moreGroups = visibleNavigationGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => !primaryLabels.includes(item.label)) }))
      .filter((group) => group.items.length > 0);
    const moreActive = moreGroups.some((group) => group.items.some((item) => isActiveRoute(pathname, item.href)));

    return (
      <>
        <AnimatePresence>
          {moreOpen && (
            <div className="fixed inset-0 z-[60] xl:hidden">
              <motion.button
                type="button"
                aria-label="Close tools menu"
                onClick={() => setMoreOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-x-3 bottom-[92px] flex max-h-[calc(100dvh-112px)] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-black/70"
              >
                <div className="flex items-start justify-between border-b border-slate-200/80 px-5 py-4 dark:border-white/[0.08]">
                  <div>
                    <p className="text-base font-black text-slate-950 dark:text-white">Explore FlowMind</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose a goal first, then open the right tool.</p>
                  </div>
                  <button type="button" onClick={() => setMoreOpen(false)} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white" aria-label="Close tools menu">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:thin]">
                  {moreGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <section key={group.id}>
                        <div className="mb-2 flex items-center gap-2 px-1">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"><GroupIcon className="h-4 w-4" /></span>
                          <div>
                            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">{group.label}</h2>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{group.description}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveRoute(pathname, item.href);
                            return (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => navigateTo(item.href)}
                                className={`relative min-h-[104px] overflow-hidden rounded-2xl border p-3 text-left transition ${
                                  active
                                    ? "border-blue-300 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-400/[0.08]"
                                    : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-white/[0.14] dark:hover:bg-white/[0.055]"
                                }`}
                              >
                                <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-white text-slate-600 shadow-sm dark:bg-white/[0.07] dark:text-slate-300"}`}>
                                  <Icon className="h-[18px] w-[18px]" />
                                </span>
                                <span className="mt-3 block text-sm font-bold text-slate-800 dark:text-slate-100">{item.label}</span>
                                <span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.description}</span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <nav aria-label="Mobile workspace navigation" className={`fixed inset-x-3 bottom-3 z-[70] grid grid-cols-5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#0b0f19] dark:shadow-black/40 xl:hidden ${className}`}>
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);
            return (
              <button key={item.label} type="button" onClick={() => navigateTo(item.href)} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-colors duration-200 sm:text-xs ${active ? "text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"}`}>
                {active && <motion.span layoutId="workspace-mobile-active" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-xl bg-slate-950 shadow-sm dark:bg-slate-100" />}
                <Icon className={`relative z-10 h-5 w-5 ${active ? "dark:text-slate-950" : ""}`} />
                <span className={`relative z-10 max-w-full truncate ${active ? "dark:text-slate-950" : ""}`}>{item.mobileLabel ?? item.label}</span>
              </button>
            );
          })}

          <button type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} aria-label="Explore FlowMind tools" className={`relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1 py-2.5 text-[10px] font-semibold transition-colors duration-200 sm:text-xs ${moreOpen || moreActive ? "text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"}`}>
            {(moreOpen || moreActive) && <motion.span layoutId="workspace-mobile-active" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-xl bg-slate-950 shadow-sm dark:bg-slate-100" />}
            <MoreHorizontal className={`relative z-10 h-5 w-5 ${moreOpen || moreActive ? "dark:text-slate-950" : ""}`} />
            <span className={`relative z-10 ${moreOpen || moreActive ? "dark:text-slate-950" : ""}`}>Explore</span>
          </button>
        </nav>
      </>
    );
  }

  const toggleGroup = (groupId: NavigationGroupId) => {
    setOpenGroups((current) => current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]);
  };

  return (
    <div className={className}>
      {showBrand && (
        <button type="button" onClick={() => router.push("/dashboard")} aria-label="Open FlowMind dashboard" className="mb-5 block rounded-xl p-1 transition-opacity hover:opacity-80">
          <FlowMindLogo size="md" variant="full" href="" />
        </button>
      )}

      <div className={showBrand ? "border-t border-slate-200/80 pt-5 dark:border-white/[0.08]" : ""}>
        <div className="mb-3 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Workspace</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-500">Start with essentials. Explore more only when needed.</p>
        </div>

        <nav aria-label="Workspace navigation" className="space-y-3">
          {visibleNavigationGroups.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = group.items.some((item) => isActiveRoute(pathname, item.href));
            const isOpen = !group.collapsible || openGroups.includes(group.id) || groupActive;

            return (
              <section key={group.id} className={group.collapsible ? "rounded-2xl border border-slate-200/70 bg-white/45 p-1.5 dark:border-white/[0.06] dark:bg-white/[0.018]" : ""}>
                {group.collapsible ? (
                  <button type="button" onClick={() => toggleGroup(group.id)} aria-expanded={isOpen} className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${groupActive ? "bg-slate-100 dark:bg-white/[0.055]" : "hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${groupActive ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300"}`}><GroupIcon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{group.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-slate-400 dark:text-slate-500">{group.items.length} tools</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <div className="mb-1 px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{group.label}</p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={group.collapsible ? { height: 0, opacity: 0 } : false} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                      <div className={`${group.collapsible ? "mt-1 space-y-1" : "space-y-1"}`}>
                        {group.items.map((item) => (
                          <DesktopNavigationItem key={item.label} item={item} active={isActiveRoute(pathname, item.href)} count={item.countKey ? counts[item.countKey] : undefined} onNavigate={router.push} activeItemRef={activeDesktopItemRef} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
