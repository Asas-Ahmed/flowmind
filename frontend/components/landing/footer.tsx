import { FlowMindLogo } from "../brand/flowmind-logo";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-200/40 bg-white/50 backdrop-blur-md px-6 py-8 dark:border-white/10 dark:bg-slate-950/50 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted md:flex-row">
        <FlowMindLogo />
        <p>© 2026 FlowMind. An ASAS Labs project.</p>
        <p>Tasks • Habits • Focus • Analytics • Flow Assistant</p>
      </div>
    </footer>
  );
}