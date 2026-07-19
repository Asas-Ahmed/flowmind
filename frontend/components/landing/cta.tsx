"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="relative z-10 px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65 }}
        className="cta-panel relative mx-auto max-w-[1408px] overflow-hidden rounded-[2rem] px-5 py-16 text-center text-white sm:px-8 lg:rounded-[3rem] lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 soft-grid opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-xl">
            <Sparkles className="h-5 w-5 text-cyan-200" />
          </span>
          <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Your work deserves more than another list.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
            Build a calmer system that understands your priorities, protects your focus, and helps you adapt with confidence.
          </p>
          <a href="/dashboard" className="group mt-9 inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-2xl transition hover:-translate-y-1">
            Start with FlowMind
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
