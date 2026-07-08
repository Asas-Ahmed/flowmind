import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-bold transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      "aurora-gradient text-white shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5":
        variant === "primary",
      "surface-soft text-app hover:-translate-y-0.5": variant === "secondary",
      "text-muted hover:bg-white/60 hover:text-app dark:hover:bg-white/10":
        variant === "ghost",
      "bg-slate-950 text-white shadow-xl shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100":
        variant === "dark",
    },
    {
      "px-4 py-2 text-sm": size === "sm",
      "px-5 py-2.5 text-sm": size === "md",
      "px-7 py-4 text-base": size === "lg",
    },
    className
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}