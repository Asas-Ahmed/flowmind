"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, BrainCircuit, CalendarCheck2, ScanSearch } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Bring your day into focus",
    description: "Capture tasks, routines, goals, schedules, and the signals that affect your energy and attention.",
    icon: ScanSearch,
  },
  {
    number: "02",
    title: "Let the system connect the dots",
    description: "FlowMind turns fragmented activity into priorities, patterns, workload context, and realistic time plans.",
    icon: BrainCircuit,
  },
  {
    number: "03",
    title: "Act on one clear next move",
    description: "Start the right task, protect a focus block, adjust your schedule, or recover before overload builds.",
    icon: CalendarCheck2,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const glowY = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#080b18] px-5 py-16 text-white shadow-[0_40px_120px_rgba(15,23,42,0.28)] sm:px-8 lg:rounded-[3rem] lg:px-14 lg:py-24">
        <motion.div style={{ y: glowY }} className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-25 soft-grid" />

        <div className="relative grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Designed around decisions</p>
            <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Less managing the system. More doing the work.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
              The experience is designed as a simple loop: understand your current state, choose the right action, and learn from what happened.
            </p>
            <a href="#pricing" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-cyan-300 transition hover:gap-3">
              See launch access <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div className="relative space-y-4">
            <div className="absolute bottom-12 left-[27px] top-12 w-px bg-gradient-to-b from-cyan-300/0 via-cyan-300/50 to-fuchsia-400/0 sm:left-[35px]" />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, x: 36 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-90px" }}
                  transition={{ duration: 0.62, delay: index * 0.08 }}
                  className="relative grid grid-cols-[56px_1fr] gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:grid-cols-[72px_1fr] sm:gap-6 sm:p-6"
                >
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10 sm:h-[72px] sm:w-[72px]">
                    <Icon className="h-6 w-6 text-cyan-300 sm:h-7 sm:w-7" />
                  </div>
                  <div className="py-1 sm:py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">Step {step.number}</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
