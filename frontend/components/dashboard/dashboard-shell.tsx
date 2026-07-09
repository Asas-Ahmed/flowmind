"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  Focus,
  Home,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  MoreHorizontal,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardLoader } from "./dashboard-loader";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Tasks", icon: ListTodo },
  { label: "Habits", icon: Flame },
  { label: "Focus", icon: Timer },
  { label: "Schedule", icon: CalendarDays },
  { label: "Analytics", icon: BarChart3 },
  { label: "Flow Assistant", icon: Brain },
  { label: "Settings", icon: Settings },
];

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
  { name: "Morning planning", progress: 100 },
  { name: "Deep work session", progress: 75 },
  { name: "Study review", progress: 58 },
  { name: "Wellness check-in", progress: 42 },
];

const weekProgress = [
  { day: "Mon", value: 52 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 74 },
  { day: "Thu", value: 84 },
  { day: "Fri", value: 61 },
  { day: "Sat", value: 38 },
  { day: "Sun", value: 46 },
];

const schedule = [
  { time: "09:00", title: "Planning session" },
  { time: "11:30", title: "Deep work block" },
  { time: "15:00", title: "Project review" },
];

const assistantTips = [
  "Start with your highest priority dashboard task first.",
  "Your focus trend is stronger before lunch today.",
  "One habit is at risk. Complete it before evening.",
];

const LOADER_KEY = "flowmind-dashboard-loader-seen";

export function DashboardShell() {
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

    return () => window.cancelAnimationFrame(frame);
  }, []);

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
          y: isChecking || showLoader ? 10 : 0,
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50"
      >
      <div className="pointer-events-none fixed inset-0 soft-grid opacity-70" />
      <div className="pointer-events-none fixed left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none fixed right-0 top-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl dark:bg-fuchsia-500/10" />

      <div className="relative flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200/70 bg-white/72 px-5 py-5 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/50 lg:block">
          <div className="flex h-full flex-col">
            <div className="mb-8">
              <FlowMindLogo size="md" variant="full" />
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      item.active
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15 dark:bg-white dark:text-slate-950"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-3xl border border-cyan-200/70 bg-cyan-50/80 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl aurora-gradient text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">Flow Assistant</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                Smart guidance for tasks, habits, focus, and productivity.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/80 px-4 py-4 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-[#050816]/80 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl aurora-gradient text-white shadow-lg shadow-indigo-500/20">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    FlowMind
                  </p>
                  <h1 className="text-base font-semibold">Dashboard</h1>
                </div>
              </div>

              <div className="hidden lg:block">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Good morning, Asas 👋
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">
                  Ready to focus today?
                </h1>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <div className="hidden max-w-sm flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 md:flex">
                  <Search className="h-4 w-4" />
                  <span>Search tasks, habits, schedules...</span>
                </div>

                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 transition hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-white"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-cyan-400" />
                </button>

                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-6 px-4 pt-6 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pb-6">
            <div className="min-w-0 space-y-6">
              <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/82 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Today&apos;s Focus
                    </div>
                    <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                      Build your dashboard foundation and keep momentum.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Flow Assistant recommends starting with the dashboard UI
                      structure, then moving into tasks, habits, and focus
                      modules.
                    </p>
                  </div>

                  <div className="rounded-3xl aurora-gradient p-5 text-white shadow-2xl shadow-indigo-500/20 lg:w-72">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white/80">
                        Focus Session
                      </p>
                      <Timer className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-4xl font-bold">25:00</p>
                    <p className="mt-2 text-sm text-white/80">
                      Recommended next deep work block
                    </p>
                    <button
                      type="button"
                      className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                    >
                      Start Focus
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      key={stat.title}
                      className="rounded-3xl border border-slate-200/80 bg-white/82 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                        {stat.title}
                      </p>
                      <h3 className="mt-1 text-3xl font-bold">{stat.value}</h3>
                      <p className="mt-2 text-xs text-cyan-600 dark:text-cyan-300">
                        {stat.helper}
                      </p>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <article className="rounded-[2rem] border border-slate-200/80 bg-white/82 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Weekly Progress</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Productivity trend this week
                      </p>
                    </div>
                    <Activity className="h-5 w-5 text-cyan-500" />
                  </div>

                  <div className="flex h-64 items-end gap-3">
                    {weekProgress.map((item) => (
                      <div
                        key={item.day}
                        className="flex flex-1 flex-col items-center gap-3"
                      >
                        <div className="flex h-48 w-full items-end rounded-full bg-slate-100 p-1 dark:bg-white/10">
                          <div
                            className="w-full rounded-full aurora-gradient"
                            style={{ height: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[2rem] border border-slate-200/80 bg-white/82 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Today&apos;s Tasks</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Priority queue
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                  </div>

                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.title}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        {task.done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{task.title}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{task.time}</span>
                            <span>•</span>
                            <span>{task.tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-[2rem] border border-slate-200/80 bg-white/82 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Habit Progress</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Daily consistency tracker
                      </p>
                    </div>
                    <Flame className="h-5 w-5 text-cyan-500" />
                  </div>

                  <div className="space-y-5">
                    {habits.map((habit) => (
                      <div key={habit.name}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">{habit.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {habit.progress}%
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className="h-full rounded-full aurora-gradient"
                            style={{ width: `${habit.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[2rem] border border-slate-200/80 bg-white/82 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Upcoming Schedule</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Next blocks for today
                      </p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-cyan-500" />
                  </div>

                  <div className="space-y-4">
                    {schedule.map((item) => (
                      <div key={item.time} className="flex gap-4">
                        <div className="w-14 text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                          {item.time}
                        </div>
                        <div className="relative flex-1 border-l border-slate-200 pl-4 dark:border-white/10">
                          <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-cyan-400" />
                          <p className="text-sm font-semibold">{item.title}</p>
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

            <aside className="hidden space-y-6 xl:block">
              <article className="sticky top-24 rounded-[2rem] border border-slate-200/80 bg-white/82 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/20">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl aurora-gradient text-white shadow-lg shadow-indigo-500/20">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">Flow Assistant</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Smart productivity coach
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-200/70 bg-cyan-50/80 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                    <MessageCircle className="h-4 w-4" />
                    AI Suggestion
                  </div>
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                    You have 3 important tasks today. Start with one 25-minute
                    focus session before checking new notifications.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {assistantTips.map((tip) => (
                    <div
                      key={tip}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                    >
                      {tip}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask Flow Assistant
                </button>
              </article>
            </aside>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-5 rounded-3xl border border-slate-200/80 bg-white/85 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 lg:hidden">
        {[
          { label: "Home", icon: LayoutDashboard },
          { label: "Tasks", icon: ListTodo },
          { label: "Focus", icon: Target },
          { label: "Habits", icon: Flame },
          { label: "AI", icon: Brain },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </motion.main>
  </>
  );
}