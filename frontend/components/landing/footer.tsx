import { ArrowUpRight } from "lucide-react";
import { FlowMindLogo } from "../brand/flowmind-logo";

const links = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Launch access", href: "#pricing" },
  { label: "Sign in", href: "/login" },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-200/60 bg-white/45 px-4 py-10 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/45 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1408px] gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <FlowMindLogo size="sm" />
          <p className="mt-4 max-w-md text-sm leading-6 text-muted">
            An intelligent productivity and life-management workspace built to help students and professionals plan clearly, focus deeply, and work sustainably.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-muted md:justify-end">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="inline-flex items-center gap-1 transition hover:text-indigo-600 dark:hover:text-cyan-300">
              {link.label} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1408px] flex-col gap-2 border-t border-slate-200/60 pt-6 text-xs text-muted dark:border-white/8 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 FlowMind. An ASAS project.</p>
        <p>Focus. Flow. Achieve.</p>
      </div>
    </footer>
  );
}
