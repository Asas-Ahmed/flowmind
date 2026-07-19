"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Play, Sparkles } from "lucide-react";
import { buttonStyles } from "../ui/button";
import { DashboardPreview } from "./preview";

const proofPoints = ["Unified planning", "Explainable guidance", "Built for real routines"];

export function Hero() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-32 lg:pt-20">
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="surface-soft mx-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 shadow-sm dark:text-cyan-200 sm:px-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          Intelligent productivity, without the noise
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.68, delay: 0.06, ease: "easeOut" }}
          className="text-app mx-auto mt-7 max-w-5xl text-[clamp(3.2rem,8vw,7.25rem)] font-black leading-[0.9] tracking-[-0.065em]"
        >
          Turn a busy life into a <span className="aurora-text">clear next move.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
          className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
        >
          FlowMind brings tasks, habits, focus, schedules, wellbeing, and personal insights into one calm workspace that helps you decide what matters now.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href="/dashboard" className={buttonStyles({ variant: "primary", size: "lg", className: "group min-w-52" })}>
            Enter FlowMind
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#preview" className={buttonStyles({ variant: "secondary", size: "lg", className: "min-w-52" })}>
            <Play className="mr-2 h-4 w-4 fill-current" />
            Explore the product
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted sm:text-sm"
        >
          {proofPoints.map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </span>
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 38, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-14 max-w-7xl sm:mt-18"
      >
        <div className="pointer-events-none absolute inset-x-[12%] -top-14 h-44 rounded-full bg-gradient-to-r from-cyan-400/20 via-indigo-500/25 to-fuchsia-500/20 blur-3xl" />
        <DashboardPreview />
      </motion.div>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["01", "Plan"],
          ["02", "Focus"],
          ["03", "Reflect"],
          ["04", "Adapt"],
        ].map(([number, label]) => (
          <div key={number} className="surface-soft flex items-center gap-3 rounded-2xl px-4 py-3 text-left">
            <span className="font-mono text-xs font-black text-indigo-600 dark:text-cyan-300">{number}</span>
            <span className="text-sm font-bold text-app">{label}</span>
            <Sparkles className="ml-auto h-3.5 w-3.5 text-fuchsia-400" />
          </div>
        ))}
      </div>
    </section>
  );
}
