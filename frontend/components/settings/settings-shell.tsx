"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  Mail,
  MonitorCog,
  RotateCcw,
  Save,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  BellRing,
} from "lucide-react";

import { SpinnerLoader } from "@/components/common/spinner-loader";
import { WorkspaceTopbar } from "@/components/navigation/workspace-topbar";
import {
  getUserProfile,
  ProfileUpdatePayload,
  updateUserProfile,
  UserProfile,
} from "@/lib/api";
import {
  FEATURE_PREFERENCE_GROUPS,
  useFeaturePreferences,
} from "@/lib/feature-preferences";

const timezones = [
  {
    value: "Asia/Colombo",
    label: "Sri Lanka — Colombo",
  },
  {
    value: "Asia/Kolkata",
    label: "India — Kolkata",
  },
  {
    value: "Asia/Dubai",
    label: "United Arab Emirates — Dubai",
  },
  {
    value: "Asia/Singapore",
    label: "Singapore",
  },
  {
    value: "Asia/Tokyo",
    label: "Japan — Tokyo",
  },
  {
    value: "Europe/London",
    label: "United Kingdom — London",
  },
  {
    value: "Europe/Paris",
    label: "Central Europe — Paris",
  },
  {
    value: "America/New_York",
    label: "United States — New York",
  },
  {
    value: "America/Chicago",
    label: "United States — Chicago",
  },
  {
    value: "America/Los_Angeles",
    label: "United States — Los Angeles",
  },
  {
    value: "Australia/Sydney",
    label: "Australia — Sydney",
  },
  {
    value: "UTC",
    label: "UTC",
  },
];

const initialForm: ProfileUpdatePayload = {
  full_name: "",
  timezone: "Asia/Colombo",
  daily_focus_goal_minutes: 120,
  week_starts_on: "monday",
  email_notifications: true,
  task_reminders: true,
  habit_reminders: true,
  weekly_summary: true,
  compact_dashboard: false,
};

const cardClass =
  "rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/20";

type PreferenceToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: PreferenceToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-white/20">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20 dark:bg-slate-700 dark:peer-checked:bg-cyan-500">
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </label>
  );
}

export function SettingsShell() {

  async function sendTestNotification() {
    if (typeof Notification === "undefined") {
      alert("Browser notifications are not supported on this device.");
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      alert("Notifications are blocked. Please allow them in your browser/site settings first.");
      return;
    }

    new Notification("FlowMind test notification", {
      body: "Notifications are working correctly on this device.",
      icon: "/brand/flowmind-icon-192.png",
      badge: "/brand/flowmind-icon-192.png",
    });
  }

  const router = useRouter();
  const {
    enabledCount,
    totalCount,
    isFeatureEnabled,
    setFeatureEnabled,
    enableAllFeatures,
  } = useFeaturePreferences();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileUpdatePayload>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const profileData = await getUserProfile();

        if (!isMounted) {
          return;
        }

        setProfile(profileData);

        setForm({
          full_name: profileData.full_name,
          timezone: profileData.timezone,
          daily_focus_goal_minutes:
            profileData.daily_focus_goal_minutes,
          week_starts_on: profileData.week_starts_on,
          email_notifications: profileData.email_notifications,
          task_reminders: profileData.task_reminders,
          habit_reminders: profileData.habit_reminders,
          weekly_summary: profileData.weekly_summary,
          compact_dashboard: profileData.compact_dashboard,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your profile.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<K extends keyof ProfileUpdatePayload>(
    field: K,
    value: ProfileUpdatePayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = form.full_name.trim().replace(/\s+/g, " ");

    if (normalizedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateUserProfile({
        ...form,
        full_name: normalizedName,
      });

      setProfile(response.profile);

      setForm({
        full_name: response.profile.full_name,
        timezone: response.profile.timezone,
        daily_focus_goal_minutes:
          response.profile.daily_focus_goal_minutes,
        week_starts_on: response.profile.week_starts_on,
        email_notifications: response.profile.email_notifications,
        task_reminders: response.profile.task_reminders,
        habit_reminders: response.profile.habit_reminders,
        weekly_summary: response.profile.weekly_summary,
        compact_dashboard: response.profile.compact_dashboard,
      });

      setSuccess(response.message);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <SpinnerLoader />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 soft-grid opacity-65" />

      <div className="pointer-events-none fixed left-1/3 top-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/10" />

      <div className="pointer-events-none fixed right-0 top-40 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/10" />

      <WorkspaceTopbar
        eyebrow="Account and preferences"
        title="Settings"
        description="Manage your profile, productivity preferences, notifications, and workspace experience."
        maxWidth="max-w-7xl"
        showSettings={false}
        showMobileLogo={true}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-xl transition hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-cyan-300">
              <Settings className="h-4 w-4" />
              Account settings
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Profile & preferences
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Personalize how FlowMind plans your day, tracks your focus,
              and sends helpful reminders.
            </p>
          </div>

          {profile && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />

              <div>
                <p className="font-semibold">Verified account</p>
                <p className="text-xs opacity-80">{profile.email}</p>
              </div>
            </div>
          )}
        
          <button
            type="button"
            onClick={sendTestNotification}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-500/15 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/15"
          >
            <BellRing className="h-4 w-4" />
            Send test notification
          </button>
</section>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"
        >
          <div className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-7`}>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl aurora-gradient text-white shadow-lg shadow-indigo-500/20">
                  <UserRound className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold">Personal information</h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Update the name displayed throughout your workspace.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">
                    Full name
                  </span>

                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(event) =>
                      updateField("full_name", event.target.value)
                    }
                    minLength={2}
                    maxLength={100}
                    required
                    autoComplete="name"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-white/[0.055] dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">
                    Email address
                  </span>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      value={profile?.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100/80 py-3 pl-11 pr-12 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400"
                    />

                    <CheckCircle2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  </div>

                  <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                    Your verified login email cannot be changed here.
                  </span>
                </label>
              </div>
            </section>

            <section className={`${cardClass} p-5 sm:p-7`}>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                  <Clock3 className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Productivity preferences
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Help FlowMind understand your schedule and daily targets.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Timezone
                  </span>

                  <select
                    value={form.timezone}
                    onChange={(event) =>
                      updateField("timezone", event.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
                  >
                    {timezones.map((timezone) => (
                      <option
                        key={timezone.value}
                        value={timezone.value}
                      >
                        {timezone.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Week starts on
                  </span>

                  <select
                    value={form.week_starts_on}
                    onChange={(event) =>
                      updateField(
                        "week_starts_on",
                        event.target.value as "monday" | "sunday",
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-900 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold">
                    <span>Daily focus goal</span>

                    <span className="rounded-xl bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-cyan-400/15 dark:text-cyan-300">
                      {form.daily_focus_goal_minutes} minutes
                    </span>
                  </span>

                  <input
                    type="range"
                    min={15}
                    max={480}
                    step={15}
                    value={form.daily_focus_goal_minutes}
                    onChange={(event) =>
                      updateField(
                        "daily_focus_goal_minutes",
                        Number(event.target.value),
                      )
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 dark:bg-slate-700 dark:accent-cyan-400"
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>15 min</span>
                    <span>8 hours</span>
                  </div>
                </label>
              </div>
            </section>

            <section className={`${cardClass} p-5 sm:p-7`}>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-300">
                  <Bell className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Notifications & reminders
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Choose which productivity updates you want to receive.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <PreferenceToggle
                  title="Email notifications"
                  description="Allow important FlowMind account and productivity emails."
                  checked={form.email_notifications}
                  onChange={(checked) =>
                    updateField("email_notifications", checked)
                  }
                />

                <PreferenceToggle
                  title="Task reminders"
                  description="Receive reminders for upcoming and overdue tasks."
                  checked={form.task_reminders}
                  onChange={(checked) =>
                    updateField("task_reminders", checked)
                  }
                />

                <PreferenceToggle
                  title="Habit reminders"
                  description="Get a helpful reminder before an active habit is missed."
                  checked={form.habit_reminders}
                  onChange={(checked) =>
                    updateField("habit_reminders", checked)
                  }
                />

                <PreferenceToggle
                  title="Weekly progress summary"
                  description="Receive a weekly review of tasks, habits, and focus time."
                  checked={form.weekly_summary}
                  onChange={(checked) =>
                    updateField("weekly_summary", checked)
                  }
                />
              </div>
            </section>

            <section className={`${cardClass} p-5 sm:p-7`}>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300">
                  <MonitorCog className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Workspace appearance
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Control how information is displayed in your dashboard.
                  </p>
                </div>
              </div>

              <PreferenceToggle
                title="Compact dashboard"
                description="Use smaller cards and tighter spacing to display more information."
                checked={form.compact_dashboard}
                onChange={(checked) =>
                  updateField("compact_dashboard", checked)
                }
              />
            </section>

            <section className={`${cardClass} p-5 sm:p-7`}>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                    <SlidersHorizontal className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">Enabled FlowMind features</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Keep your workspace clean by showing only the tools that match your needs. Hidden features keep their existing data and can be restored anytime.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-xl bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                    {enabledCount} of {totalCount} enabled
                  </span>
                  <button
                    type="button"
                    onClick={enableAllFeatures}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Enable all
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {FEATURE_PREFERENCE_GROUPS.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{group.label}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{group.description}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.features.map((feature) => {
                        const enabled = isFeatureEnabled(feature.href);

                        return (
                          <label
                            key={feature.href}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition ${
                              feature.required
                                ? "cursor-not-allowed border-slate-200 bg-slate-100/80 dark:border-white/10 dark:bg-white/[0.035]"
                                : "cursor-pointer border-slate-200 bg-white hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-violet-400/30"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                {feature.label}
                                {feature.required && (
                                  <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
                                    Required
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                                {feature.description}
                              </span>
                            </span>

                            <input
                              type="checkbox"
                              checked={enabled}
                              disabled={feature.required}
                              onChange={(event) => setFeatureEnabled(feature.href, event.target.checked)}
                              className="peer sr-only"
                            />

                            <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-violet-600 peer-focus-visible:ring-4 peer-focus-visible:ring-violet-500/20 peer-disabled:opacity-60 dark:bg-slate-700 dark:peer-checked:bg-cyan-500">
                              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-6" : "left-1"}`} />
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className={`${cardClass} overflow-hidden`}>
              <div className="aurora-gradient p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-sm text-white/75">
                      FlowMind profile
                    </p>

                    <h2 className="text-xl font-bold">
                      {form.full_name || "Your workspace"}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-indigo-500 dark:text-cyan-300" />

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Daily focus target
                    </p>

                    <p className="text-sm font-semibold">
                      {form.daily_focus_goal_minutes} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-indigo-500 dark:text-cyan-300" />

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Planning week
                    </p>

                    <p className="text-sm font-semibold capitalize">
                      Starts on {form.week_starts_on}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Account security
                    </p>

                    <p className="text-sm font-semibold">
                      Email verified
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl aurora-gradient px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save profile
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Return to dashboard
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}