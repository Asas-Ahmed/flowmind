"use client";

import { motion } from "framer-motion";

const tasks = ["Finish DP UI section", "Review database schema", "Read 20 minutes"];

export function DashboardPreview() {
  return (
    <motion.div
      id="preview"
      className="relative"
      initial={{ opacity: 0, scale: 0.96, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
    >
      <div className="float-slow glass-card rounded-4xl p-4">
        <div className="rounded-3xl border border-slate-200/10 bg-slate-950 p-5 text-white shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Good morning, Asas 👋</p>
              <h2 className="mt-1 text-2xl font-bold">Today&apos;s Focus Plan</h2>
            </div>

            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              Live Preview
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm text-slate-400">Productivity Score</p>
              <p className="mt-3 text-4xl font-black">86</p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 w-[86%] rounded-full bg-cyan-300" />
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm text-slate-400">Focus Timer</p>
              <p className="mt-3 text-4xl font-black">25:00</p>
              <p className="mt-4 text-sm text-cyan-200">Deep work block ready</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-linear-to-br from-indigo-500/30 via-purple-500/20 to-cyan-400/20 p-4 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-cyan-100">Flow Assistant</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              &ldquo;Start with your high-priority assignment, then protect one
              focus session before checking new tasks.&rdquo;
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {tasks.map((task, index) => (
              <div
                key={task}
                className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{task}</span>
                </div>

                <span className="text-xs text-slate-400">Today</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-soft absolute -bottom-8 -left-6 hidden rounded-3xl p-5 shadow-2xl md:block">
        <p className="text-app text-sm font-bold">Habit Progress</p>

        <div className="mt-3 flex gap-2">
          {[80, 50, 95, 65].map((height) => (
            <div key={height} className="flex h-20 w-8 items-end rounded-full bg-slate-200/70 dark:bg-white/10">
              <div
                className="w-full rounded-full bg-linear-to-t from-indigo-500 to-cyan-300"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}