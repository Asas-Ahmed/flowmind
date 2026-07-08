"use client";

import { motion } from "framer-motion";
import { BarChart3, Brain, CheckCircle2, Timer } from "lucide-react";
import { Card, CardDescription, CardTitle } from "../ui/card";

const features = [
  {
    title: "Smart Task Planning",
    description:
      "Organize daily work with priorities, due dates, and intelligent focus suggestions.",
    icon: CheckCircle2,
  },
  {
    title: "Habit Tracking",
    description:
      "Build consistent routines with streaks, progress insights, and gentle reminders.",
    icon: BarChart3,
  },
  {
    title: "Focus Sessions",
    description:
      "Use structured focus blocks to reduce distraction and complete important work faster.",
    icon: Timer,
  },
  {
    title: "Flow Assistant",
    description:
      "Get calm recommendations based on tasks, habits, schedules, and productivity patterns.",
    icon: Brain,
  },
];

export function Features() {
  return (
    <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-cyan-300">
          Intelligent workspace
        </p>

        <h2 className="text-app mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Everything you need to manage your day with clarity.
        </h2>

        <p className="mt-5 text-lg leading-8 text-muted">
          FlowMind combines planning, routines, focus, and insights so your
          productivity system feels connected instead of scattered.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
            >
              <Card className="h-full p-6 transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="aurora-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                  <Icon className="h-6 w-6" />
                </div>

                <CardTitle className="mt-6">{feature.title}</CardTitle>
                <CardDescription className="mt-3">
                  {feature.description}
                </CardDescription>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}