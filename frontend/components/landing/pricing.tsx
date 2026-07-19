"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";

const included = [
  "All productivity workspaces",
  "Flow Assistant recommendations",
  "Analytics and personal patterns",
  "Smart planning and scheduling",
  "Dark and light themes",
  "Responsive desktop and mobile experience",
];

export function Pricing() {
  return (
    <section id="pricing" className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="section-kicker">Launch access</p>
        <h2 className="section-title mt-5">Explore the complete FlowMind experience.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted">
          During the initial release period, every workspace is available without plan restrictions. Use the full system and discover the workflow that fits you.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65 }}
        className="relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-[2rem] border border-indigo-400/20 bg-slate-950 p-5 text-white shadow-[0_40px_110px_rgba(79,70,229,0.22)] sm:p-8 lg:rounded-[2.5rem] lg:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> Full launch access
            </div>
            <div className="mt-7 flex items-end gap-3">
              <span className="text-6xl font-black tracking-[-0.06em]">Free</span>
              <span className="pb-2 text-sm font-semibold text-slate-400">for the first 2 months</span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              No feature comparison, locked tools, or confusing tiers during the launch period. The product is ready to explore as one connected system.
            </p>
            <a href="/dashboard" className="group mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5">
              Open your workspace
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Everything included</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-white/[0.035] p-3 ring-1 ring-white/5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-xs font-semibold leading-5 text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-white/8 pt-5 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-cyan-300" /> Built with privacy, explainability, and responsible guidance in mind.
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
