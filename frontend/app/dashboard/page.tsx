import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950 dark:bg-[#050816] dark:text-white">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm font-medium text-cyan-500">
              FlowMind Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Good morning, Asas 👋
            </h1>

            <p className="mt-4 max-w-2xl text-slate-600 dark:text-white/60">
              Your intelligent productivity workspace is getting ready. Next we
              will build the real dashboard layout with tasks, habits, focus
              sessions, analytics, and Flow Assistant.
            </p>
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}