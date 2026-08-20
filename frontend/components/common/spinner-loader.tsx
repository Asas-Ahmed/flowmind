import { cn } from "@/lib/utils";

type SpinnerLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

export function SpinnerLoader({
  label = "Loading...",
  fullScreen = false,
  className,
}: SpinnerLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-300 border-t-slate-700 dark:border-slate-800 dark:border-t-white" />

        {label && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {label}
          </p>
        )}
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}