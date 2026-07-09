"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Brain, Sparkles, Target, Waves } from "lucide-react";
import { motion } from "framer-motion";

type DashboardLoaderProps = {
  onFinish?: () => void;
};

const loadingSteps = [
  { label: "Focus", sub: "Stay on track", Icon: Target },
  { label: "Flow", sub: "Work in flow", Icon: Waves },
  { label: "Mind", sub: "Smart guidance", Icon: Brain },
  { label: "Achieve", sub: "Reach more", Icon: Sparkles },
];

export function DashboardLoader({ onFinish }: DashboardLoaderProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFinish?.();
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden bg-[#040714] text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_58%_50%,rgba(118,43,188,0.24),transparent_38%),radial-gradient(circle_at_50%_88%,rgba(207,77,225,0.12),transparent_34%)]" />
      <div className="absolute inset-0 soft-grid opacity-[0.18]" />

      <motion.div
        className="absolute h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
        animate={{ scale: [1, 1.16, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.92, 1, 1, 0.96],
            y: [8, 0, 0, -12],
          }}
          transition={{
            times: [0, 0.18, 0.72, 1],
            duration: 0.85,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/brand/asas-logo.png"
            alt="ASAS Labs"
            width={1000}
            height={1000}
            priority
            className="w-[160px] sm:w-[190px] lg:w-[220px] h-auto object-contain select-none opacity-90"
            />

          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.42em] text-white/50">
            An ASAS Labs Project
          </p>
        </motion.div>

        <motion.div
          className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
          initial={{ opacity: 0, scale: 0.72, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.55, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-cyan-300/20 via-blue-500/10 to-fuchsia-500/20 blur-xl"
            animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />

          <Image
            src="/brand/flowmind-icon-512.png"
            alt="FlowMind app logo"
            width={180}
            height={180}
            priority
            className="relative z-10 rounded-2xl overflow-hidden drop-shadow-[0_0_34px_rgba(59,242,253,0.45)]"
          />
        </motion.div>

        <motion.div
          className="mt-7 font-logo text-4xl font-black uppercase tracking-[0.28em] sm:text-6xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.08, duration: 0.48, ease: "easeOut" }}
        >
          <span>Flow</span>
          <span className="bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
            Mind
          </span>
        </motion.div>

        <motion.p
          className="mt-5 text-sm font-medium uppercase tracking-[0.55em] text-white/55 sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.18, duration: 0.35 }}
        >
          Focus. Flow. Achieve.
        </motion.p>

        <motion.div
          className="mt-8 h-px w-72 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.28, duration: 0.45, ease: "easeOut" }}
        />

        <motion.div
          className="mt-9 h-1 w-72 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.38, duration: 0.75, ease: "easeInOut" }}
          />
        </motion.div>

        <motion.div
          className="mt-12 grid w-full grid-cols-2 gap-4 border-t border-white/10 pt-7 sm:grid-cols-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.42, duration: 0.45, ease: "easeOut" }}
        >
          {loadingSteps.map(({ label, sub, Icon }) => (
            <div key={label} className="flex items-center justify-center gap-3 text-left">
              <Icon className="h-7 w-7 text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/85">
                  {label}
                </p>
                <p className="mt-1 text-xs text-white/45">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}