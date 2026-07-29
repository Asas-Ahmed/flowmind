"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type FeaturePreference = {
  href: string;
  label: string;
  description: string;
  required?: boolean;
};

export type FeaturePreferenceGroup = {
  id: string;
  label: string;
  description: string;
  features: FeaturePreference[];
};

export const FEATURE_PREFERENCE_GROUPS: FeaturePreferenceGroup[] = [
  {
    id: "everyday",
    label: "Everyday workspace",
    description: "Core tools used for daily planning and execution.",
    features: [
      { href: "/dashboard", label: "Dashboard", description: "Your main workspace overview.", required: true },
      { href: "/tasks", label: "Tasks", description: "Capture, organize, and complete work." },
      { href: "/habits", label: "Habits", description: "Build and maintain helpful routines." },
      { href: "/focus", label: "Focus", description: "Run focused work sessions." },
      { href: "/schedule", label: "Schedule", description: "Plan events and time blocks." },
    ],
  },
  {
    id: "planning",
    label: "Planning & organization",
    description: "Optional tools for structuring goals, time, and work.",
    features: [
      { href: "/goals", label: "Goals & Targets", description: "Set weekly outcomes and targets." },
      { href: "/time-budget", label: "Time Budget", description: "Allocate time across life areas." },
      { href: "/time-tracking", label: "Time Tracking", description: "Record where your time goes." },
      { href: "/work-categories", label: "Work Categories", description: "Organize different areas of work." },
      { href: "/if-then", label: "If–Then Planner", description: "Prepare responses to likely obstacles." },
      { href: "/procrastination", label: "Start Small", description: "Break difficult work into a first step." },
    ],
  },
  {
    id: "insights",
    label: "Insights & coaching",
    description: "Analytics, reflection, and intelligent guidance.",
    features: [
      { href: "/analytics", label: "Analytics", description: "Explore productivity performance." },
      { href: "/productivity", label: "Productivity", description: "Review your productivity score." },
      { href: "/deep-work", label: "Deep Work", description: "Analyze focus quality and patterns." },
      { href: "/productivity-heatmap", label: "Productivity Heatmap", description: "View long-term consistency." },
      { href: "/weekly-review", label: "Weekly Review", description: "Reflect on the previous week." },
      { href: "/weekly-coach", label: "AI Weekly Coach", description: "Receive a weekly coaching summary." },
      { href: "/recommendations", label: "Recommendations", description: "See suggested next actions." },
      { href: "/personal-patterns", label: "Personal Patterns", description: "Discover how you work best." },
      { href: "/activity", label: "Activity Timeline", description: "Review recent workspace activity." },
    ],
  },
  {
    id: "wellbeing",
    label: "Energy & wellbeing",
    description: "Optional tools supporting sustainable productivity.",
    features: [
      { href: "/life-balance", label: "Life Balance", description: "Review balance across important areas." },
      { href: "/movement", label: "Movement", description: "Track healthy movement breaks." },
      { href: "/energy", label: "Energy Check-In", description: "Record energy, stress, and focus." },
      { href: "/sleep", label: "Sleep", description: "Track sleep regularity." },
      { href: "/cognitive-load", label: "Cognitive Load", description: "Notice mental overload." },
      { href: "/burnout", label: "Workload Warning", description: "Review unsustainable workload signals." },
      { href: "/nourishment", label: "Hydration & Meals", description: "Track nourishment awareness." },
      { href: "/recovery", label: "Recovery Breaks", description: "Use guided recovery activities." },
      { href: "/eye-care", label: "Eye Care", description: "Follow the 20-20-20 rule." },
    ],
  },
  {
    id: "growth",
    label: "Improve & experiment",
    description: "Specialized tools for behaviour change and experimentation.",
    features: [
      { href: "/distractions", label: "Distraction Log", description: "Identify interruption patterns." },
      { href: "/habit-breaker", label: "Habit Breaker", description: "Track recovery from unwanted habits." },
      { href: "/experiments", label: "Experiments", description: "Test productivity strategies." },
    ],
  },
  {
    id: "account",
    label: "Account",
    description: "Controls required to manage your workspace.",
    features: [
      { href: "/settings", label: "Settings", description: "Manage account and feature preferences.", required: true },
    ],
  },
];

const STORAGE_KEY = "flowmind.enabled-features.v1";
const CHANGE_EVENT = "flowmind-feature-preferences-changed";

const allFeatureHrefs = FEATURE_PREFERENCE_GROUPS.flatMap((group) =>
  group.features.map((feature) => feature.href),
);
const requiredFeatureHrefs = FEATURE_PREFERENCE_GROUPS.flatMap((group) =>
  group.features.filter((feature) => feature.required).map((feature) => feature.href),
);

function normalizeEnabledFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [...allFeatureHrefs];

  const allowed = new Set(allFeatureHrefs);
  const enabled = new Set(
    value.filter((href): href is string => typeof href === "string" && allowed.has(href)),
  );

  requiredFeatureHrefs.forEach((href) => enabled.add(href));
  return allFeatureHrefs.filter((href) => enabled.has(href));
}

function readEnabledFeatures(): string[] {
  if (typeof window === "undefined") return [...allFeatureHrefs];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeEnabledFeatures(JSON.parse(stored)) : [...allFeatureHrefs];
  } catch {
    return [...allFeatureHrefs];
  }
}

function persistEnabledFeatures(enabled: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function useFeaturePreferences() {
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(allFeatureHrefs);

  useEffect(() => {
    const sync = () => setEnabledFeatures(readEnabledFeatures());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const enabledSet = useMemo(() => new Set(enabledFeatures), [enabledFeatures]);

  const setFeatureEnabled = useCallback((href: string, enabled: boolean) => {
    const current = new Set(readEnabledFeatures());

    if (requiredFeatureHrefs.includes(href)) return;
    if (enabled) current.add(href);
    else current.delete(href);

    const normalized = normalizeEnabledFeatures([...current]);
    persistEnabledFeatures(normalized);
    setEnabledFeatures(normalized);
  }, []);

  const enableAllFeatures = useCallback(() => {
    persistEnabledFeatures([...allFeatureHrefs]);
    setEnabledFeatures([...allFeatureHrefs]);
  }, []);

  const isFeatureEnabled = useCallback(
    (href: string) => enabledSet.has(href),
    [enabledSet],
  );

  return {
    enabledFeatures,
    enabledCount: enabledFeatures.length,
    totalCount: allFeatureHrefs.length,
    isFeatureEnabled,
    setFeatureEnabled,
    enableAllFeatures,
  };
}
