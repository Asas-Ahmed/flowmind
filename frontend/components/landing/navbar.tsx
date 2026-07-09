"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { FlowMindLogo } from "../brand/flowmind-logo";
import { ThemeToggle } from "../ui/theme-toggle";
import { buttonStyles } from "../ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Preview", href: "#preview" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-6 py-4 lg:px-8">
      <div className="nav-surface flex items-center justify-between rounded-full px-4 py-3 shadow-xl shadow-slate-950/5">
        <FlowMindLogo />

        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-indigo-600 dark:hover:text-cyan-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          <a href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Sign in
          </a>

          <a href="/dashboard" className={buttonStyles({ variant: "dark", size: "md" })}>
            Get Started
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="surface-soft inline-flex h-10 w-10 items-center justify-center rounded-full text-app"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="nav-surface mt-3 rounded-3xl p-4 shadow-xl md:hidden">
          <div className="grid gap-2 text-sm font-semibold text-muted">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-2xl px-4 py-3 transition hover:bg-white/50 hover:text-indigo-600 dark:hover:text-cyan-300 dark:hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}

            <a
              href="/dashboard"
              className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-center font-bold text-white dark:bg-white dark:text-slate-950"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}