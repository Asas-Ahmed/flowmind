"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  Flame,
  LayoutDashboard,
  MoreHorizontal,
  Play,
  Sparkles,
  Target,
} from "lucide-react";

const tasks = [
  { title: "Complete literature review", meta: "High priority · 90 min", done: false },
  { title: "Review system architecture", meta: "Today · 35 min", done: true },
  { title: "Prepare focus block", meta: "Suggested next", done: false },
];

export function DashboardPreview() {
  return (
    <div id="preview" className="relative scroll-mt-28">
      <div className="preview-shell overflow-hidden rounded-[1.75rem] p-2 sm:rounded-[2.25rem] sm:p-3">
        <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#080b18] text-white shadow-[0_50px_120px_rgba(15,23,42,0.38)] sm:rounded-[1.75rem]">
          <div className="flex h-11 items-center justify-between border-b border-white/8 px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-400 sm:flex">
              <Command className="h-3 w-3" />
              flowmind.app/dashboard
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Live system
            </div>
          </div>

          <div className="grid min-h-[620px] lg:grid-cols-[190px_1fr]">
            <aside className="hidden border-r border-white/8 bg-white/[0.018] p-4 lg:flex lg:flex-col">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <div className="aurora-gradient flex h-8 w-8 items-center justify-center rounded-xl font-black">F</div>
                <div>
                  <p className="text-sm font-black tracking-wide">FLOWMIND</p>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-slate-500">Workspace</p>
                </div>
              </div>

              <div className="mt-7 space-y-1 text-xs font-semibold text-slate-400">
                {[
                  [LayoutDashboard, "Overview", true],
                  [CheckCircle2, "Tasks", false],
                  [Target, "Goals", false],
                  [Clock3, "Focus", false],
                  [CalendarDays, "Schedule", false],
                  [BarChart3, "Analytics", false],
                ].map(([Icon, label, active]) => {
                  const ItemIcon = Icon as typeof LayoutDashboard;
                  return (
                    <div
                      key={label as string}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${active ? "bg-white/10 text-white" : ""}`}
                    >
                      <ItemIcon className="h-4 w-4" />
                      {label as string}
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 p-3 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" /> Flow Assistant
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-400">Your clearest focus window starts at 7:00 PM.</p>
              </div>
            </aside>

            <div className="min-w-0 p-4 sm:p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Sunday, 19 July</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Good morning, Asas.</h2>
                  <p className="mt-1 text-xs text-slate-400">Your day is balanced. Protect one deep-work block.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 ring-1 ring-white/10" aria-label="Notifications">
                    <Bell className="h-4 w-4" />
                  </button>
                  <div className="aurora-gradient flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black">AA</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["82", "Productivity", "+8 this week"],
                  ["3h 40m", "Deep work", "Goal 4h"],
                  ["7 days", "Best streak", "Keep it going"],
                ].map(([value, label, note], index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/8"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-black">{value}</p>
                    <p className="mt-1 text-[10px] text-cyan-300">{note}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/8 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">Today&apos;s priority</p>
                      <p className="mt-1 text-[10px] text-slate-500">3 meaningful actions</p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {tasks.map((task) => (
                      <div key={task.title} className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-3 ring-1 ring-white/5">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${task.done ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-slate-500"}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-xs font-semibold ${task.done ? "text-slate-500 line-through" : "text-slate-200"}`}>{task.title}</p>
                          <p className="mt-0.5 text-[9px] text-slate-500">{task.meta}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-400/10 p-4 ring-1 ring-white/10 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                    <span className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-bold text-cyan-200">READY</span>
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Focus session</p>
                  <p className="mt-1 text-4xl font-black tracking-tight">25:00</p>
                  <p className="mt-2 text-[10px] leading-4 text-slate-400">A protected block for your highest-impact task.</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400" />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/8 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">Weekly rhythm</p>
                      <p className="mt-1 text-[10px] text-slate-500">Focused minutes</p>
                    </div>
                    <BarChart3 className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[38, 62, 47, 80, 68, 92, 58].map((height, index) => (
                      <div key={index} className="flex h-full flex-1 items-end rounded-md bg-white/[0.035]">
                        <div className="w-full rounded-md bg-gradient-to-t from-indigo-600 to-cyan-300" style={{ height: `${height}%` }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/8 sm:p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-200">
                    <Sparkles className="h-4 w-4" /> Flow Assistant
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">
                    You finish complex work more consistently in the evening. Move the literature review to your 7 PM focus window.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-cyan-300">
                    Apply suggestion <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-soft absolute -bottom-7 left-5 hidden items-center gap-3 rounded-2xl p-3 shadow-2xl md:flex lg:-left-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500"><Flame className="h-5 w-5" /></span>
        <div><p className="text-xs font-black text-app">7-day streak</p><p className="mt-0.5 text-[10px] text-muted">Consistency is building</p></div>
      </div>

      <div className="surface-soft absolute -right-5 top-24 hidden items-center gap-3 rounded-2xl p-3 shadow-2xl md:flex lg:-right-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500"><Target className="h-5 w-5" /></span>
        <div><p className="text-xs font-black text-app">82% aligned</p><p className="mt-0.5 text-[10px] text-muted">Weekly goal progress</p></div>
      </div>
    </div>
  );
}
