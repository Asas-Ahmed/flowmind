"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonStyles } from "../ui/button";
import { DashboardPreview } from "./preview";

export function Hero() {
  return (
    <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-20 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-28 lg:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="surface-soft mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-cyan-300">
          <span className="pulse-soft h-2 w-2 rounded-full bg-cyan-400" />
          Flow Assistant is ready to guide your day
        </div>

        <h1 className="text-app max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          Plan smarter, <span className="aurora-text">focus deeper</span>,
          achieve more.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          FlowMind helps students and professionals manage tasks, habits, focus
          sessions, schedules, and productivity insights in one intelligent
          workspace.
        </p>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row">
          <a href="#preview" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Explore FlowMind
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>

          <a href="#features" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            See Features
          </a>
        </div>

        <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
          {[
            ["92%", "Focus score"],
            ["18", "Tasks planned"],
            ["7 day", "Habit streak"],
          ].map(([value, label]) => (
            <div key={label} className="surface-soft rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <p className="text-app text-2xl font-black">{value}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <DashboardPreview />
    </section>
  );
}