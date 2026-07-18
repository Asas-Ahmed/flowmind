"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  Focus,
  ListTodo,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import { DashboardLoader } from "./dashboard-loader";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { WorkspaceSidebar } from "@/components/navigation/workspace-sidebar";
import { getDashboardData } from "@/lib/api";
import type { DashboardData } from "@/types/dashboard";

const LOADER_KEY = "flowmind-dashboard-loader-seen";
const card = "rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20";

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function DashboardShell() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getDashboardData());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hasSeenLoader = sessionStorage.getItem(LOADER_KEY);
      if (!hasSeenLoader) {
        sessionStorage.setItem(LOADER_KEY, "true");
        setShowLoader(true);
      }
      setIsChecking(false);
      void loadDashboard();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadDashboard]);

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Productivity Score", value: `${data.productivity_score}%`, helper: `${data.score_change >= 0 ? "+" : ""}${data.score_change}% from yesterday`, icon: data.score_change >= 0 ? TrendingUp : TrendingDown },
      { title: "Tasks Due Today", value: String(data.tasks_due_today), helper: `${data.overdue_tasks} overdue · ${data.completed_today} completed`, icon: ListTodo },
      { title: "Focus Time", value: formatMinutes(data.focus_minutes_today), helper: `${data.focus_goal_rate}% of ${formatMinutes(data.focus_goal_minutes)} goal`, icon: Focus },
      { title: "Habit Progress", value: `${data.habits_completed_today}/${data.habits_due_today}`, helper: `${data.habit_completion_rate}% completed today`, icon: Flame },
    ];
  }, [data]);

  return (
    <>
      <AnimatePresence mode="wait">{showLoader && <DashboardLoader onFinish={() => setShowLoader(false)} />}</AnimatePresence>
      <motion.main initial={false} animate={{ opacity: isChecking || showLoader ? 0 : 1 }} className="relative min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50">
        <div className="pointer-events-none fixed inset-0 soft-grid opacity-65" />
        <div className="pointer-events-none fixed left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
        <WorkspaceSidebar taskCount={data?.tasks_due_today ?? 0} habitCount={data?.habits_due_today ?? 0} insightTitle="Live Dashboard" insightText="Real activity from tasks, habits, focus sessions, and schedules." />

        <div className="relative min-h-screen xl:pl-[272px]">
          <WorkspaceTopbar
            eyebrow={`Welcome back, ${
              data?.user_name?.split(" ")[0] ?? "there"
            } 👋`}
            title="Your live productivity overview"
            description="Tasks, habits, focus sessions, schedules, and insights in one place."
            actions={
              <button
                type="button"
                onClick={() => void loadDashboard()}
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            }
          />

          <div className="mx-auto grid max-w-[1800px] gap-6 px-4 pb-32 pt-6 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</div>}

              <section className={`${card} overflow-hidden p-6`}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Flow Assistant insight</div><h2 className="text-3xl font-bold sm:text-4xl">{data?.insight.title ?? "Building your overview..."}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{data?.insight.message ?? "FlowMind is combining your latest productivity activity."}</p></div>
                  {data && <button onClick={() => router.push(data.insight.action_href)} className="rounded-2xl aurora-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg">{data.insight.action_label}</button>}
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {stats.map((stat) => { const Icon = stat.icon; return <article key={stat.title} className={`${card} p-5`}><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300"><Icon className="h-5 w-5" /></div><p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{stat.title}</p><h3 className="mt-1 text-3xl font-bold">{stat.value}</h3><p className="mt-2 text-xs font-medium text-cyan-600 dark:text-cyan-300">{stat.helper}</p></article>; })}
              </section>

              <section className="grid gap-6 2xl:grid-cols-[1.15fr_.85fr]">
                <article className={`${card} p-6`}> <div className="mb-6 flex items-center justify-between"> <div> <h3 className="text-lg font-bold">Weekly productivity trend</h3> <p className="text-sm text-slate-500"> Combined tasks, habits, and focus score </p> </div> <Activity className="h-5 w-5 text-cyan-500" /> </div> {data?.weekly_trend.some((point) => point.score > 0) ? ( <div className="flex h-64 items-end gap-3"> {data.weekly_trend.map((point) => ( <div key={point.date} className="flex flex-1 flex-col items-center gap-3" > <span className="text-xs font-semibold">{point.score}%</span> <div className="flex h-44 w-full items-end rounded-full bg-slate-100 p-1 dark:bg-white/10"> {point.score > 0 ? ( <motion.div initial={{ height: 0 }} animate={{ height: `${point.score}%` }} className="w-full rounded-full aurora-gradient" /> ) : null} </div> <span className="text-xs text-slate-500">{point.day}</span> </div> ))} </div> ) : ( <div className="flex h-64 items-center justify-center"> <div className="max-w-sm text-center"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-300"> <Activity className="h-6 w-6" /> </div> <p className="mt-4 font-semibold">No productivity activity yet</p> <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400"> Complete tasks, habits, or focus sessions to start building your weekly trend. </p> </div> </div> )} </article>
                <article className={`${card} p-6`}><div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold">Priority tasks</h3><p className="text-sm text-slate-500">Your strongest next actions</p></div><CheckCircle2 className="h-5 w-5 text-cyan-500" /></div><div className="space-y-3">{data?.priority_tasks.length ? data.priority_tasks.map((task) => <button key={task.id} onClick={() => router.push("/tasks")} className="flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 p-4 text-left dark:border-white/10"><Circle className="mt-0.5 h-5 w-5 text-slate-400" /><div className="min-w-0"><p className="truncate font-semibold">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.due_at ? `Due ${formatTime(task.due_at)}` : "No due time"} · {task.eisenhower.replaceAll("_", " ")}</p></div></button>) : <Empty text="No active priority tasks." />}</div></article>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <article className={`${card} p-6`}><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold">Today&apos;s habits</h3><Flame className="h-5 w-5 text-fuchsia-500" /></div><div className="space-y-4">{data?.habits.length ? data.habits.map((habit) => <button key={habit.id} onClick={() => router.push("/habits")} className="w-full text-left"><div className="mb-2 flex justify-between gap-3"><span className="font-medium">{habit.name}</span><span className="text-xs text-slate-500">{habit.completed_today ? "Complete" : `${habit.progress}%`}</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.max(4, habit.progress)}%`, backgroundColor: habit.color }} /></div></button>) : <Empty text="No habits are scheduled today." />}</div></article>
                <article className={`${card} p-6`}><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold">Upcoming schedule</h3><CalendarDays className="h-5 w-5 text-indigo-500" /></div><div className="space-y-3">{data?.upcoming_schedule.length ? data.upcoming_schedule.map((item) => <button key={item.id} onClick={() => router.push("/schedule")} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 p-4 text-left dark:border-white/10"><span className="h-10 w-1 rounded-full" style={{ backgroundColor: item.color }} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.title}</p><p className="text-xs text-slate-500">{formatTime(item.start_at)} – {formatTime(item.end_at)}</p></div><Clock3 className="h-4 w-4 text-slate-400" /></button>) : <Empty text="No upcoming events this week." />}</div></article>
              </section>
            </div>

            <aside className="space-y-6">
              <article className={`${card} p-6`}><h3 className="text-lg font-bold">Performance balance</h3><p className="mt-1 text-sm text-slate-500">How each area contributes today</p><div className="mt-6 space-y-5"><Rate label="Task completion" value={data?.task_completion_rate ?? 0} icon={CheckCircle2} /><Rate label="Habit consistency" value={data?.habit_completion_rate ?? 0} icon={Flame} /><Rate label="Focus goal" value={data?.focus_goal_rate ?? 0} icon={Focus} /></div></article>
              <article className={`${card} p-6`}><div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"><AlertTriangle className="h-5 w-5" /></div><div><h3 className="font-bold">Attention needed</h3><p className="text-sm text-slate-500">{data?.overdue_tasks ?? 0} overdue tasks</p></div></div><button onClick={() => router.push("/tasks")} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-white/10">Review backlog</button></article>
            </aside>
          </div>
          <WorkspaceNavigation variant="mobile" counts={{ tasks: data?.tasks_due_today ?? 0, habits: data?.habits_due_today ?? 0 }} />
        </div>
      </motion.main>
    </>
  );
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/15">{text}</div>; }

function Rate({ label, value, icon: Icon }: { label: string; value: number; icon: typeof CheckCircle2 }) { return <div><div className="mb-2 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><strong>{value}%</strong></div><div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full aurora-gradient" style={{ width: `${value}%` }} /></div></div>; }
