"use client";

import Link from "next/link";
import { loginUser, registerUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Timer,
  User,
} from "lucide-react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type AuthMode = "login" | "register" | "forgot";

type AuthFormProps = {
  mode: AuthMode;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const authCopy = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to FlowMind",
    description:
      "Continue your productivity flow with tasks, habits, focus sessions, and smart insights.",
    button: "Sign in",
    loading: "Signing in...",
    success: "Signed in successfully. Opening your dashboard...",
    footerText: "New to FlowMind?",
    footerLink: "Create an account",
    footerHref: "/register",
  },
  register: {
    eyebrow: "Start your flow",
    title: "Create your FlowMind account",
    description:
      "Build a calmer workspace for planning, deep work, habits, and productivity insights.",
    button: "Create account",
    loading: "Creating account...",
    success: "Account created successfully. Opening your dashboard...",
    footerText: "Already have an account?",
    footerLink: "Sign in",
    footerHref: "/login",
  },
  forgot: {
    eyebrow: "Reset access",
    title: "Forgot your password?",
    description:
      "Enter your email and we will prepare the reset flow UI. Email sending will connect later.",
    button: "Send reset link",
    loading: "Preparing reset link...",
    success: "Reset password UI validated. Email service comes later.",
    footerText: "Remembered your password?",
    footerLink: "Back to login",
    footerHref: "/login",
  },
};

const benefits = [
  {
    title: "Smart workspace",
    description: "Tasks, habits, focus, and schedule in one calm dashboard.",
    icon: Brain,
  },
  {
    title: "Focus-first flow",
    description: "Designed to help users start important work faster.",
    icon: Timer,
  },
  {
    title: "Secure foundation",
    description: "Ready for JWT authentication when backend starts.",
    icon: ShieldCheck,
  },
];

const previewStats = [
  { label: "Focus score", value: "84%" },
  { label: "Habits", value: "5/6" },
  { label: "Tasks", value: "7" },
];

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const copy = authCopy[mode];

  const passwordStrength = useMemo(() => {
    const password = form.password;

    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    return score;
  }, [form.password]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === "register" && form.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full name.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (mode !== "forgot") {
      if (!form.password) {
        nextErrors.password = "Password is required.";
      } else if (form.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }
    }

    if (mode === "register") {
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccessMessage("");

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage("");

    try {
      if (mode === "forgot") {
        setSuccessMessage(
          "Password reset is not connected yet. Email service will be added later.",
        );
        return;
      }

      if (mode === "register") {
        await registerUser(form.fullName.trim(), form.email, form.password);
      }

      await loginUser(form.email, form.password);

      setSuccessMessage(copy.success);
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";

      setErrors((current) => ({
        ...current,
        email: message,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50">
      <div className="absolute inset-0 soft-grid opacity-70" />

      <div className="pointer-events-none absolute -left-32 top-[-140px] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/15" />
      <div className="pointer-events-none absolute right-[-120px] top-28 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl dark:bg-fuchsia-500/15" />
      <div className="pointer-events-none absolute bottom-[-180px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <FlowMindLogo />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-cyan-300 hover:text-slate-950 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-cyan-400/60 dark:hover:text-white sm:inline-flex"
            >
              Back home
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div className="hidden lg:block">
            <div className="max-w-xl reveal-soft">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-50/80 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" />
                FlowMind Aurora Authentication
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white xl:text-6xl">
                Secure access for your{" "}
                <span className="aurora-text">smart productivity flow.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
                This is the polished authentication UI layer. Backend JWT,
                database users, and real email reset will connect later without
                redesigning these screens.
              </p>
            </div>

            <div className="mt-10 grid max-w-xl gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="glass-card reveal-scale rounded-3xl p-5"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-950 dark:text-white">
                          {benefit.title}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 max-w-xl rounded-3xl border border-slate-200/80 bg-white/65 p-5 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-slate-700/50 dark:bg-slate-900/55">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Today&apos;s preview
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dashboard opens after demo login
                  </p>
                </div>
                <CalendarCheck className="h-5 w-5 text-cyan-500" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {previewStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/50 dark:bg-slate-950/40"
                  >
                    <p className="text-xl font-bold text-slate-950 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md reveal-scale">
            <div className="glass-card rounded-[2rem] p-5 shadow-2xl sm:p-7">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl aurora-gradient text-white shadow-lg shadow-fuchsia-500/20">
                  <LockKeyhole className="h-6 w-6" />
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
                  {copy.eyebrow}
                </p>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {copy.title}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {copy.description}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {mode === "register" && (
                  <FieldWrapper
                    label="Full name"
                    error={errors.fullName}
                    htmlFor="fullName"
                  >
                    <User className="h-5 w-5 text-slate-400" />
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      placeholder="John Doe"
                      className="auth-input"
                      autoComplete="name"
                    />
                  </FieldWrapper>
                )}

                <FieldWrapper label="Email" error={errors.email} htmlFor="email">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="you@example.com"
                    className="auth-input"
                    autoComplete="email"
                  />
                </FieldWrapper>

                {mode !== "forgot" && (
                  <FieldWrapper
                    label="Password"
                    error={errors.password}
                    htmlFor="password"
                  >
                    <LockKeyhole className="h-5 w-5 text-slate-400" />
                    <input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                      placeholder="Enter your password"
                      className="auth-input pr-11"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </FieldWrapper>
                )}

                {mode === "register" && (
                  <>
                    <FieldWrapper
                      label="Confirm password"
                      error={errors.confirmPassword}
                      htmlFor="confirmPassword"
                    >
                      <LockKeyhole className="h-5 w-5 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type={isConfirmVisible ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(event) =>
                          updateField("confirmPassword", event.target.value)
                        }
                        placeholder="Confirm your password"
                        className="auth-input pr-11"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setIsConfirmVisible((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label={
                          isConfirmVisible
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {isConfirmVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </FieldWrapper>

                    <div className="rounded-2xl border border-slate-200/80 bg-white/55 p-3 dark:border-slate-700/60 dark:bg-slate-950/30">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          Password strength
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {passwordStrength}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full aurora-gradient transition-all duration-300"
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                      />
                      Remember me
                    </label>

                    <Link
                      href="/forgot-password"
                      className="font-semibold text-indigo-600 transition hover:text-fuchsia-600 dark:text-cyan-300 dark:hover:text-fuchsia-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl aurora-gradient px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.01] hover:shadow-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {copy.loading}
                    </>
                  ) : (
                    <>
                      {copy.button}
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                {copy.footerText}{" "}
                <Link
                  href={copy.footerHref}
                  className="font-bold text-indigo-600 transition hover:text-fuchsia-600 dark:text-cyan-300 dark:hover:text-fuchsia-300"
                >
                  {copy.footerLink}
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
              Secure JWT authentication connected through httpOnly cookies.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FieldWrapper({
  label,
  error,
  htmlFor,
  children,
}: Readonly<{
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}>) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>

      <div
        className={`relative flex items-center gap-3 rounded-2xl border bg-white/75 px-4 py-3 shadow-sm backdrop-blur transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/10 dark:bg-slate-950/35 ${
          error
            ? "border-rose-300 dark:border-rose-400/50"
            : "border-slate-200/80 dark:border-slate-700/70"
        }`}
      >
        {children}
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}