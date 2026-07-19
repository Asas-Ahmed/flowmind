"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Brain,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  HeartPulse,
  Sparkles,
  TimerReset,
} from "lucide-react";

const capabilities = [
  { icon: CheckCircle2, label: "Task intelligence" },
  { icon: TimerReset, label: "Adaptive focus" },
  { icon: CalendarClock, label: "Smart scheduling" },
  { icon: ChartNoAxesCombined, label: "Deep analytics" },
  { icon: HeartPulse, label: "Wellbeing awareness" },
  { icon: Brain, label: "Personal patterns" },
];

export function Features() {
  return (
    <section id="features" className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="grid items-end gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="section-kicker">One connected system</p>
          <h2 className="section-title mt-5 max-w-xl">
            Not another to-do list. A complete operating system for your day.
          </h2>
        </div>
        <p className="max-w-2xl text-base leading-8 text-muted lg:justify-self-end lg:text-lg">
          FlowMind connects execution, reflection, and wellbeing instead of forcing you to maintain separate apps. Every workspace contributes to a clearer picture of how you work best.
        </p>
      </div>

      <div className="mt-14 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
        <motion.article
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="feature-panel group min-h-[410px] overflow-hidden lg:col-span-7 lg:row-span-2"
        >
          <div className="relative z-10 flex h-full flex-col p-6 sm:p-8 lg:p-10">
            <span className="feature-icon"><Sparkles className="h-5 w-5" /></span>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-cyan-300">Flow Assistant</p>
            <h3 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.04em] text-app sm:text-4xl">
              Guidance that explains itself.
            </h3>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">
              Recommendations are grounded in your tasks, focus history, routines, workload, and personal patterns—so every suggestion has a clear reason behind it.
            </p>

            <div className="mt-auto pt-10">
              <div className="max-w-lg rounded-[1.5rem] border border-white/50 bg-white/75 p-5 shadow-[0_24px_70px_rgba(79,70,229,0.13)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-cyan-300">
                  <Sparkles className="h-4 w-4" /> TODAY&apos;S RECOMMENDATION
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-app">
                  Move your research task to 7:00 PM. Your recent sessions show stronger focus and fewer interruptions during that window.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted">
                  Based on 14 focus sessions <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl transition duration-700 group-hover:scale-125" />
          <div className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="feature-panel min-h-[198px] lg:col-span-5"
        >
          <div className="flex h-full flex-col justify-between p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="feature-icon"><Activity className="h-5 w-5" /></span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Live insight</span>
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-black tracking-tight text-app">See the pattern behind the progress.</h3>
              <p className="mt-3 text-sm leading-6 text-muted">Understand focus quality, workload, energy, consistency, and goal alignment in one view.</p>
            </div>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.14 }}
          className="feature-panel min-h-[198px] lg:col-span-5"
        >
          <div className="flex h-full flex-col justify-between p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <span className="feature-icon"><CalendarClock className="h-5 w-5" /></span>
              <div className="flex -space-x-2">
                {["T", "H", "F", "S"].map((item) => <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[10px] font-black text-white dark:border-slate-900">{item}</span>)}
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-black tracking-tight text-app">Everything works together.</h3>
              <p className="mt-3 text-sm leading-6 text-muted">Tasks, habits, focus, schedule, goals, and wellbeing signals remain connected.</p>
            </div>
          </div>
        </motion.article>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {capabilities.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="surface-soft flex items-center gap-3 rounded-2xl px-4 py-4"
            >
              <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-cyan-300" />
              <span className="text-xs font-bold text-app">{item.label}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
