"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Prevent hydration mismatch without useEffect/setState
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const activeTheme = theme === "system" ? resolvedTheme : theme;

  if (!mounted) {
    return (
      <button
        type="button"
        className="surface-soft h-10 w-10 rounded-full"
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
      className="surface-soft inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:-translate-y-0.5"
      aria-label="Toggle dark and light theme"
    >
      {activeTheme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </button>
  );
}