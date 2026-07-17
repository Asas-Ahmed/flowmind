"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  Focus,
  ListTodo,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Search,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutUser } from "@/lib/api";

import { DashboardLoader } from "./dashboard-loader";

const stats = [
  {
    title: "Productivity Score",
    value: "84%",
    helper: "+12% from yesterday",
    icon: TrendingUp,
  },
  {
    title: "Tasks Due Today",
    value: "7",
    helper: "3 high priority",
    icon: ListTodo,
  },
  {
    title: "Focus Time",
    value: "2h 40m",
    helper: "Goal: 4 hours",
    icon: Focus,
  },
  {
    title: "Habit Progress",
    value: "5/6",
    helper: "1 habit left today",
    icon: Flame,
  },
];

const tasks = [
  {
    title: "Finish dashboard UI structure",
    tag: "High",
    time: "10:30 AM",
    done: true,
  },
  {
    title: "Review SRS dashboard requirements",
    tag: "Medium",
    time: "12:00 PM",
    done: false,
  },
  {
    title: "Plan task management module",
    tag: "High",
    time: "3:30 PM",
    done: false,
  },
];

const habits = [
  {
    name: "Morning planning",
    progress: 100,
  },
  {
    name: "Deep work session",
    progress: 75,
  },
  {
    name: "Study review",
    progress: 58,
  },
  {
    name: "Wellness check-in",
    progress: 42,
  },
];

const weekProgress = [
  {
    day: "Mon",
    value: 52,
  },
  {
    day: "Tue",
    value: 68,
  },
  {
    day: "Wed",
    value: 74,
  },
  {
    day: "Thu",
    value: 84,
  },
  {
    day: "Fri",
    value: 61,
  },
  {
    day: "Sat",
    value: 38,
  },
  {
    day: "Sun",
    value: 46,
  },
];

const schedule = [
  {
    time: "09:00",
    title: "Planning session",
  },
  {
    time: "11:30",
    title: "Deep work block",
  },
  {
    time: "15:00",
    title: "Project review",
  },
];

const assistantTips = [
  "Start with your highest-priority dashboard task first.",
  "Your focus trend is stronger before lunch today.",
  "One habit is at risk. Complete it before evening.",
];

const LOADER_KEY = "flowmind-dashboard-loader-seen";

const dashboardCardClass =
  "rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20";

export function DashboardShell() {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hasSeenLoader = sessionStorage.getItem(LOADER_KEY);

      if (!hasSeenLoader) {
        sessionStorage.setItem(LOADER_KEY, "true");
        setShowLoader(true);
      }

      setIsChecking(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      document.cookie =
        "flowmind_access_token=; path=/; max-age=0; SameSite=Lax";

      document.cookie =
        "flowmind_refresh_token=; path=/; max-age=0; SameSite=Lax";

      sessionStorage.removeItem(LOADER_KEY);

      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <DashboardLoader onFinish={() => setShowLoader(false)} />
        )}
      </AnimatePresence>

      <motion.main
        initial={false}
        animate={{
          opacity: isChecking || showLoader ? 0 : 1,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
        className="relative min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50"
      >
        {/* Fixed dashboard background */}
        <div className="pointer-events-none fixed inset-0 soft-grid opacity-65" />

        <div className="pointer-events-none fixed left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/10" />

        <div className="pointer-events-none fixed right-0 top-32 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/10" />

        {/* Desktop sidebar */}
        <WorkspaceSidebar
          taskCount={tasks.length}
          habitCount={habits.length}
          insightTitle="Flow Assistant"
          insightText="Review your day, protect your focus, and keep your progress moving."
        />

        {/* Dashboard content */}
        <div className="relative min-h-screen xl:pl-[272px]">
          {/* Sticky dashboard header */}
          <header className="sticky top-0 z-40 border-b border-slate-200/75 bg-slate-50/88 px-4 py-3 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-[#050816]/88 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3">
              {/* Mobile logo */}
              <div className="min-w-0 xl:hidden">
                <FlowMindLogo
                  variant="full"
                  size="sm"
                  href=""
                  showSubtitle={false}
                />
              </div>

              {/* Desktop greeting */}
              <div className="hidden min-w-0 xl:block">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Good morning, Asas 👋
                </p>

                <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight xl:text-2xl">
                  Ready to focus today?
                </h1>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
                {/* Desktop search */}
                <button
                  type="button"
                  className="hidden min-w-0 max-w-md flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-left text-sm text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900 md:flex"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    Search tasks, habits, schedules...
                  </span>

                  <span className="ml-auto hidden rounded-lg border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 xl:inline">
                    Ctrl K
                  </span>
                </button>

                {/* Mobile search */}
                <button
                  type="button"
                  aria-label="Search"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white md:hidden"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>

                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white sm:h-11 sm:w-11"
                >
                  <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />

                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-cyan-400 dark:border-slate-900" />
                </button>

                <ThemeToggle />

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-rose-400/20 dark:hover:bg-rose-400/10 dark:hover:text-rose-300 sm:h-11 sm:px-4"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden text-sm font-medium sm:inline">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-[1800px] gap-6 px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* Main dashboard column */}
            <div className="min-w-0 space-y-6">
              {/* Hero */}
              <section
                className={`${dashboardCardClass} overflow-hidden p-5 sm:p-6`}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Today&apos;s Focus
                    </div>

                    <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                      Build your dashboard foundation and keep your momentum.
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Flow Assistant recommends finishing the dashboard
                      structure first, then moving into tasks, habits, and focus
                      modules.
                    </p>
                  </div>

                  <div className="relative shrink-0 overflow-hidden rounded-3xl aurora-gradient p-5 text-white shadow-2xl shadow-indigo-500/20 lg:w-72">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white/80">
                          Focus Session
                        </p>

                        <Timer className="h-5 w-5" />
                      </div>

                      <p className="mt-5 text-4xl font-bold">25:00</p>

                      <p className="mt-2 text-sm text-white/80">
                        Recommended next deep-work block
                      </p>

                      <button
                        type="button"
                        className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90"
                      >
                        Start Focus
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Statistics */}
              <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      key={stat.title}
                      className={`${dashboardCardClass} group p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-2xl dark:hover:border-cyan-400/20`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-cyan-50 group-hover:text-cyan-700 dark:bg-white/10 dark:text-slate-200 dark:group-hover:bg-cyan-400/10 dark:group-hover:text-cyan-200">
                          <Icon className="h-5 w-5" />
                        </div>

                        <button
                          type="button"
                          aria-label={`More options for ${stat.title}`}
                          className="rounded-xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                        {stat.title}
                      </p>

                      <h3 className="mt-1 text-3xl font-bold">{stat.value}</h3>

                      <p className="mt-2 text-xs font-medium text-cyan-600 dark:text-cyan-300">
                        {stat.helper}
                      </p>
                    </article>
                  );
                })}
              </section>

              {/* Progress and tasks */}
              <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <article className={`${dashboardCardClass} p-5 sm:p-6`}>
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">Weekly Progress</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Productivity trend this week
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
                      <Activity className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex h-64 items-end gap-2 sm:gap-3">
                    {weekProgress.map((item) => (
                      <div
                        key={item.day}
                        className="flex min-w-0 flex-1 flex-col items-center gap-3"
                      >
                        <div className="flex h-48 w-full items-end rounded-full bg-slate-100 p-1 dark:bg-white/10">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${item.value}%` }}
                            transition={{
                              duration: 0.7,
                              ease: "easeOut",
                            }}
                            className="w-full rounded-full aurora-gradient"
                          />
                        </div>

                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={`${dashboardCardClass} p-5 sm:p-6`}>
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">Today&apos;s Tasks</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Priority queue
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <button
                        key={task.title}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50/50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-cyan-400/25 dark:hover:bg-cyan-400/[0.06]"
                      >
                        {task.done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                        )}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              task.done
                                ? "text-slate-500 line-through dark:text-slate-400"
                                : ""
                            }`}
                          >
                            {task.title}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{task.time}</span>
                            <span>•</span>
                            <span>{task.tag}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>
              </section>

              {/* Habits and schedule */}
              <section className="grid gap-6 2xl:grid-cols-2">
                <article className={`${dashboardCardClass} p-5 sm:p-6`}>
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">Habit Progress</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Daily consistency tracker
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-400/10 dark:text-orange-300">
                      <Flame className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    {habits.map((habit) => (
                      <div key={habit.name}>
                        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                          <span className="truncate font-medium">
                            {habit.name}
                          </span>

                          <span className="shrink-0 text-slate-500 dark:text-slate-400">
                            {habit.progress}%
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${habit.progress}%` }}
                            transition={{
                              duration: 0.7,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full aurora-gradient"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={`${dashboardCardClass} p-5 sm:p-6`}>
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">Upcoming Schedule</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Next blocks for today
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    {schedule.map((item) => (
                      <div key={item.time} className="flex gap-4">
                        <div className="w-14 shrink-0 text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                          {item.time}
                        </div>

                        <div className="relative min-w-0 flex-1 border-l border-slate-200 pl-4 dark:border-white/10">
                          <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-400 dark:border-[#111526]" />

                          <p className="truncate text-sm font-semibold">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Auto-planned productivity block
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </div>

            {/* Persistent desktop Flow Assistant */}
            <aside className="hidden min-w-0 xl:block">
              <div className="sticky top-[104px]">
                <article
                  className={`${dashboardCardClass} flex max-h-[calc(100vh-128px)] min-h-[540px] flex-col overflow-hidden shadow-2xl`}
                >
                  {/* Assistant header */}
                  <div className="shrink-0 border-b border-slate-200/70 p-5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl aurora-gradient text-white shadow-lg shadow-indigo-500/20">
                        <Brain className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-bold">
                            Flow Assistant
                          </h3>

                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        </div>

                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                          Smart productivity coach
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Assistant scroll area */}
                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <div className="rounded-3xl border border-cyan-200/70 bg-cyan-50/80 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                        <MessageCircle className="h-4 w-4" />
                        AI Suggestion
                      </div>

                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                        You have three important tasks today. Start with one
                        25-minute focus session before checking new
                        notifications.
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {assistantTips.map((tip, index) => (
                        <div
                          key={tip}
                          className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {index + 1}
                            </div>

                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {tip}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-3xl border border-fuchsia-200/70 bg-fuchsia-50/70 p-4 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/[0.08]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-300" />

                        <p className="text-sm font-semibold">
                          Today&apos;s insight
                        </p>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Your strongest productivity period is currently between
                        9:00 AM and 12:00 PM.
                      </p>
                    </div>
                  </div>

                  {/* Assistant action remains visible */}
                  <div className="shrink-0 border-t border-slate-200/70 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/20">
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      <Sparkles className="h-4 w-4" />
                      Ask Flow Assistant
                    </button>
                  </div>
                </article>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile floating assistant */}
        <button
          type="button"
          aria-label="Open Flow Assistant"
          className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl aurora-gradient text-white shadow-xl shadow-indigo-500/30 transition hover:-translate-y-1 xl:hidden"
        >
          <Brain className="h-5 w-5" />

          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-50 bg-emerald-500 dark:border-[#050816]" />
        </button>

        {/* Mobile bottom navigation */}
        <WorkspaceNavigation
          variant="mobile"
          counts={{
            tasks: tasks.length,
            habits: habits.length,
          }}
        />
      </motion.main>
    </>
  );
}