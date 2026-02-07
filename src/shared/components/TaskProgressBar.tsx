/**
 * @MODULE_ID shared.components.task-progress-bar
 * @STAGE global
 * @DATA_INPUTS ["completedTasks", "totalTasks"]
 * @REQUIRED_TOOLS ["useProgressStore"]
 */
"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/core/store";

export const TaskProgressBar = () => {
  const { completedTasks, totalTasks } = useProgressStore();
  const progress = useMemo(() => {
    if (!totalTasks) return 0;
    return Math.min(100, Math.round((completedTasks / totalTasks) * 100));
  }, [completedTasks, totalTasks]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span className="font-medium tracking-wide text-slate-900">
          Task Progress
        </span>
        <span className="text-xs uppercase tracking-[0.2em]">
          {completedTasks}/{totalTasks || "--"}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200/70">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
