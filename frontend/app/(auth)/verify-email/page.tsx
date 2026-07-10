"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { FlowMindLogo } from "@/components/brand/flowmind-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  resendVerificationEmail,
  verifyEmail,
} from "@/lib/api";

type VerificationState =
  | "waiting"
  | "verifying"
  | "success"
  | "error";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const verificationStarted = useRef(false);

  const [status, setStatus] = useState<VerificationState>(
    token ? "verifying" : "waiting",
  );

  const [message, setMessage] = useState(
    token
      ? "Verifying your email address..."
      : "Check your inbox and click the verification link we sent you.",
  );

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const [cooldownSeconds, setCooldownSeconds] = useState(
    email && !token ? RESEND_COOLDOWN_SECONDS : 0,
  );

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCooldownSeconds((current) =>
        current > 0 ? current - 1 : 0,
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!token || verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const runVerification = async () => {
      try {
        const response = await verifyEmail(token);

        setStatus("success");
        setMessage(response.message);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your email address.",
        );
      }
    };

    void runVerification();
  }, [token]);

  const handleResend = async () => {
    if (
      !email
      || isResending
      || cooldownSeconds > 0
    ) {
      return;
    }

    setIsResending(true);
    setResendMessage("");

    try {
      const response = await resendVerificationEmail(email);

      setResendMessage(response.message);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to resend the verification email.";

      setResendMessage(errorMessage);

      const secondsMatch = errorMessage.match(
        /wait\s+(\d+)\s+seconds/i,
      );

      if (secondsMatch) {
        setCooldownSeconds(Number(secondsMatch[1]));
      }
    } finally {
      setIsResending(false);
    }
  };

  const Icon =
    status === "success"
      ? CheckCircle2
      : status === "error"
        ? ShieldAlert
        : MailCheck;

  const resendDisabled =
    isResending || cooldownSeconds > 0;

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
              href="/"
              className="hidden rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-cyan-300 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300 sm:inline-flex"
            >
              Back home
            </Link>

            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="glass-card w-full max-w-lg rounded-[2rem] p-6 text-center shadow-2xl sm:p-9">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${
                status === "success"
                  ? "bg-emerald-500 text-white"
                  : status === "error"
                    ? "bg-rose-500 text-white"
                    : "aurora-gradient text-white"
              }`}
            >
              {status === "verifying" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Icon className="h-7 w-7" />
              )}
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
              Email verification
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {status === "success"
                ? "Email verified"
                : status === "error"
                  ? "Verification failed"
                  : token
                    ? "Verifying your account"
                    : "Check your inbox"}
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {message}
            </p>

            {email && status !== "success" && (
              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/55 p-4 dark:border-slate-700/60 dark:bg-slate-950/30">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Verification email for
                </p>

                <p className="mt-1 break-all font-semibold">
                  {email}
                </p>

                <button
                  type="button"
                  disabled={resendDisabled}
                  onClick={handleResend}
                  className="mt-4 inline-flex min-w-58 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resend in {cooldownSeconds}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resend verification email
                    </>
                  )}
                </button>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Maximum 10 verification emails per day.
                </p>
              </div>
            )}

            {resendMessage && (
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {resendMessage}
              </p>
            )}

            {status === "success" && (
              <Link
                href="/login"
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl aurora-gradient px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20"
              >
                Continue to sign in
              </Link>
            )}

            {status === "error" && !email && (
              <Link
                href="/login"
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
              >
                Return to sign in
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#050816]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}