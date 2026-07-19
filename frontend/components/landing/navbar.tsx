"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { FlowMindLogo } from "../brand/flowmind-logo";
import { buttonStyles } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

const navLinks = [
  { label: "Product", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Preview", href: "#preview" },
  { label: "Access", href: "#pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="nav-surface flex min-h-16 items-center justify-between rounded-[1.35rem] px-3 py-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:px-4">
        <FlowMindLogo size="sm" />

        <nav className="hidden items-center rounded-full border border-slate-200/70 bg-white/55 p-1 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 transition hover:bg-white hover:text-slate-950 hover:shadow-sm dark:hover:bg-white/10 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <a href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Sign in
          </a>
          <a href="/dashboard" className={buttonStyles({ variant: "dark", size: "md" })}>
            Open workspace
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="surface-soft inline-flex h-10 w-10 items-center justify-center rounded-full text-app"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="nav-surface mt-3 rounded-[1.5rem] p-3 shadow-2xl md:hidden">
          <div className="grid gap-1 text-sm font-semibold text-muted">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-2xl px-4 py-3 transition hover:bg-white/60 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-cyan-300"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href="/login"
                className="surface-soft rounded-full px-4 py-3 text-center font-bold text-app"
              >
                Sign in
              </a>
              <a
                href="/dashboard"
                className="rounded-full bg-slate-950 px-4 py-3 text-center font-bold text-white dark:bg-white dark:text-slate-950"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
