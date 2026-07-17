"use client";

import { Brain } from "lucide-react";

import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";

type WorkspaceSidebarProps = {
  taskCount?: number;
  habitCount?: number;
  insightTitle?: string;
  insightText?: string;
  insightValue?: string;
};

export function WorkspaceSidebar({
  taskCount,
  habitCount,
  insightTitle = "Flow Assistant",
  insightText = "Your intelligent productivity workspace is ready.",
  insightValue = "Online",
}: WorkspaceSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[272px] border-r border-slate-200/80 bg-[#f8faff] shadow-[10px_0_35px_rgba(15,23,42,0.045)] dark:border-white/10 dark:bg-[#070a18] dark:shadow-black/25 xl:flex xl:flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="workspace-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5">
          <WorkspaceNavigation
            counts={{
              tasks: taskCount,
              habits: habitCount,
            }}
          />
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-[#f8faff] p-4 dark:border-white/[0.08] dark:bg-[#070a18]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-slate-200">
                <Brain className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {insightTitle}
                  </p>

                  <span className="flex shrink-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {insightValue}
                  </span>
                </div>

                <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {insightText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .workspace-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgb(148 163 184 / 0.28) transparent;
        }

        .workspace-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .workspace-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .workspace-sidebar-scroll::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgb(148 163 184 / 0.28);
        }

        .workspace-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgb(100 116 139 / 0.42);
        }

        :global(.dark) .workspace-sidebar-scroll {
          scrollbar-color: rgb(255 255 255 / 0.12) transparent;
        }

        :global(.dark)
          .workspace-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgb(255 255 255 / 0.12);
        }
      `}</style>
    </aside>
  );
}
