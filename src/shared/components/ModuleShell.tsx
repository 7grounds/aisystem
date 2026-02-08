/**
 * @MODULE_ID shared.components.module-shell
 * @STAGE global
 * @DATA_INPUTS ["tasks"]
 * @REQUIRED_TOOLS ["useProgressStore", "YuhConnector", "updateTaskProgress", "supabase"]
 */
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useProgressStore } from "@/core/store";
import { supabase } from "@/core/supabase";
import { updateTaskProgress } from "@/core/progress";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { YuhConnector } from "@/shared/tools/YuhConnector";
import type { TaskDefinition } from "@/shared/tools/taskSchema";

type ModuleShellProps = {
  moduleId: string;
  stageId: string;
  title: string;
  subtitle?: string;
  tasks: TaskDefinition[];
  toolRenderers?: Record<string, (task: TaskDefinition) => ReactNode>;
};

export const ModuleShell = ({
  moduleId,
  stageId,
  title,
  subtitle,
  tasks,
  toolRenderers,
}: ModuleShellProps) => {
  const [completedTasks, setCompletedTasksLocal] = useState<
    Record<string, boolean>
  >({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const { setTotalTasks, setCompletedTasks } = useProgressStore();

  const completedCount = useMemo(() => {
    return Object.values(completedTasks).filter(Boolean).length;
  }, [completedTasks]);

  useEffect(() => {
    setTotalTasks(tasks.length);
  }, [setTotalTasks, tasks.length]);

  useEffect(() => {
    setCompletedTasks(completedCount);
  }, [completedCount, setCompletedTasks]);

  useEffect(() => {
    let isMounted = true;

    const resolveUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error || !data.user) {
        setUserId(null);
        return;
      }
      setUserId(data.user.id);
    };

    resolveUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTask = (taskId: string) => {
    const isCompleting = !completedTasks[taskId];
    setCompletedTasksLocal((prev) => ({
      ...prev,
      [taskId]: isCompleting,
    }));

    if (isCompleting && userId) {
      updateTaskProgress(userId, stageId, moduleId, taskId);
    }
  };

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {stageId} / {moduleId}
        </p>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5">
        {tasks.map((task, index) => (
          <Card key={task.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Task {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {task.title}
                </h3>
                {task.description ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {task.description}
                  </p>
                ) : null}
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  checked={Boolean(completedTasks[task.id])}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-500"
                  onChange={() => toggleTask(task.id)}
                  type="checkbox"
                />
                Done
              </label>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-600">
              {task.type === "info" ? (
                <p>{task.content}</p>
              ) : null}

              {task.type === "input" ? (
                <div className="space-y-2">
                  {task.inputLabel ? (
                    <label className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      {task.inputLabel}
                    </label>
                  ) : null}
                  <input
                    className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none"
                    onChange={(event) =>
                      setInputValues((prev) => ({
                        ...prev,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder={task.placeholder ?? "Type here"}
                    type="text"
                    value={inputValues[task.id] ?? ""}
                  />
                </div>
              ) : null}

              {task.type === "ai-coach" ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-950 px-5 py-4 text-slate-100 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-400">
                    AI Coach Prompt
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">
                    {task.prompt}
                  </p>
                  <div className="mt-4">
                    <Button size="sm" variant="success">
                      Request Guidance
                    </Button>
                  </div>
                </div>
              ) : null}

              {task.type === "tool-action" ? (
                <div className="flex flex-wrap items-center gap-3">
                  {task.toolId === "yuh-connector" ? (
                    <YuhConnector
                      action={task.action}
                      amount={task.amount}
                      currency={task.currency}
                      label={task.actionLabel}
                    />
                  ) : (
                    toolRenderers?.[task.toolId]?.(task) ?? null
                  )}
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Tool: {task.toolId}
                  </span>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
