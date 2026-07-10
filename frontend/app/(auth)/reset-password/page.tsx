"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!token) {
      setError("This password reset link is missing its security token.");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }

    if (!/[A-Za-z]/.test(password)) {
      setError("Password must contain at least one letter.");
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await resetPassword(token, password);

      setSuccessMessage(response.message);
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset your password. Please request a new link.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50">
      <div className="absolute inset-0 soft-grid opacity-70" />

      <div className="pointer-events-none absolute -left-32 top-[-140px] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/15" />
      <div className="pointer-events-none absolute right-[-120px] top-28 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl dark:bg-fuchsia-500/15" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <FlowMindLogo />

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-cyan-300 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 sm:inline-flex"
            >
              Back to login
            </Link>

            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="glass-card w-full max-w-md rounded-[2rem] p-5 shadow-2xl sm:p-7">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl aurora-gradient text-white shadow-lg shadow-fuchsia-500/20">
                <KeyRound className="h-6 w-6" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
                Secure recovery
              </p>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Create a new password
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Choose a strong password that you have not used before.
              </p>
            </div>

            {!token && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                This reset link is incomplete. Request a new link from the
                forgot-password page.
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={handleSubmit}
              noValidate
            >
              <PasswordField
                id="newPassword"
                label="New password"
                value={password}
                visible={showPassword}
                onChange={(value) => {
                  setPassword(value);
                  setError("");
                }}
                onToggle={() =>
                  setShowPassword((current) => !current)
                }
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                value={confirmPassword}
                visible={showConfirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  setError("");
                }}
                onToggle={() =>
                  setShowConfirmPassword((current) => !current)
                }
              />

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                  {error}
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
                disabled={isLoading || !token}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl aurora-gradient px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link
                href="/forgot-password"
                className="font-bold text-indigo-600 transition hover:text-fuchsia-600 dark:text-cyan-300"
              >
                Request another reset link
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


function PasswordField({
  id,
  label,
  value,
  visible,
  onChange,
  onToggle,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>

      <div className="relative flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/10 dark:border-slate-700/70 dark:bg-slate-950/35">
        <LockKeyhole className="h-5 w-5 text-slate-400" />

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your new password"
          autoComplete="new-password"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}


export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#050816]">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}