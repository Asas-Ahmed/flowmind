import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoVariant = "full" | "compact" | "mark" | "wordmark";

type FlowMindLogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

const sizeMap: Record<
  LogoSize,
  {
    mark: number;
    title: string;
    subtitle: string;
    gap: string;
  }
> = {
  xs: {
    mark: 28,
    title: "text-sm",
    subtitle: "text-[8px]",
    gap: "gap-2",
  },
  sm: {
    mark: 36,
    title: "text-base",
    subtitle: "text-[9px]",
    gap: "gap-2.5",
  },
  md: {
    mark: 44,
    title: "text-lg",
    subtitle: "text-[10px]",
    gap: "gap-3",
  },
  lg: {
    mark: 56,
    title: "text-2xl",
    subtitle: "text-xs",
    gap: "gap-4",
  },
  xl: {
    mark: 84,
    title: "text-4xl",
    subtitle: "text-sm",
    gap: "gap-5",
  },
};

function FlowMindMark({
  size = "md",
  className,
}: {
  size?: LogoSize;
  className?: string;
}) {
  const pixelSize = sizeMap[size].mark;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
    >
      <Image
        src="/brand/flowmind-icon-512.png"
        alt="FlowMind logo"
        width={pixelSize}
        height={pixelSize}
        priority
        className="h-full w-full rounded-[26%] object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.22)]"
      />
    </span>
  );
}

function FlowMindWordmark({
  size = "md",
  showSubtitle = true,
  subtitle = "Focus. Flow. Achieve.",
  className,
}: {
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 leading-none", className)}>
      <div
        className={cn(
          "font-logo font-black uppercase tracking-[0.22em]",
          "text-slate-950 dark:text-white",
          "drop-shadow-[0_1px_18px_rgba(255,255,255,0.12)]",
          sizeMap[size].title,
        )}
      >
        <span>Flow</span>
        <span className="bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
          Mind
        </span>
      </div>

      {showSubtitle && (
        <div
          className={cn(
            "mt-1.5 font-sans font-semibold uppercase tracking-[0.42em]",
            "text-slate-500 dark:text-slate-400",
            sizeMap[size].subtitle,
          )}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function FlowMindLogo({
  variant = "full",
  size = "md",
  href = "/",
  showSubtitle = true,
  subtitle = "Focus. Flow. Achieve.",
  className,
  markClassName,
  textClassName,
}: FlowMindLogoProps) {
  const content = (
    <div
      className={cn(
        "inline-flex items-center",
        sizeMap[size].gap,
        variant === "wordmark" && "gap-0",
        className,
      )}
    >
      {variant !== "wordmark" && (
        <FlowMindMark size={size} className={markClassName} />
      )}

      {(variant === "full" || variant === "wordmark") && (
        <FlowMindWordmark
          size={size}
          showSubtitle={showSubtitle}
          subtitle={subtitle}
          className={textClassName}
        />
      )}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      aria-label="FlowMind home"
      className="inline-flex items-center rounded-2xl outline-none transition-transform duration-200 hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#050816]"
    >
      {content}
    </Link>
  );
}

export function FlowMindIcon(props: Omit<FlowMindLogoProps, "variant">) {
  return <FlowMindLogo {...props} variant="mark" />;
}

export function FlowMindWordLogo(props: Omit<FlowMindLogoProps, "variant">) {
  return <FlowMindLogo {...props} variant="wordmark" />;
}

export function FlowMindCompactLogo(props: Omit<FlowMindLogoProps, "variant">) {
  return <FlowMindLogo {...props} variant="compact" />;
}

export function FlowMindLoadingLogo({
  label = "Loading your workspace",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[360px] w-full flex-col items-center justify-center overflow-hidden rounded-[2rem]",
        "border border-white/10 bg-[#070a1a] px-6 py-12 text-center",
        "shadow-[0_24px_90px_rgba(15,23,42,0.28)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(59,242,253,0.16),transparent_32%),radial-gradient(circle_at_52%_75%,rgba(207,77,225,0.14),transparent_34%)]" />

      <div className="relative">
        <FlowMindLogo
          variant="mark"
          size="xl"
          href=""
          showSubtitle={false}
          markClassName="animate-flowmind-pulse"
        />
      </div>

      <div className="relative mt-7">
        <FlowMindLogo
          variant="wordmark"
          size="lg"
          href=""
          showSubtitle={false}
        />
      </div>

      <p className="relative mt-4 font-sans text-sm font-medium uppercase tracking-[0.26em] text-white/55">
        {label}
      </p>

      <div className="relative mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500 animate-flowmind-loading" />
      </div>
    </div>
  );
}