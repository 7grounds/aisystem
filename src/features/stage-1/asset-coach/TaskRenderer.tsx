/**
 * @MODULE_ID stage-1.asset-coach.task-renderer
 * @STAGE stage-1
 * @DATA_INPUTS ["tasks", "assetInput", "progressState"]
 * @REQUIRED_TOOLS ["useProgressStore", "YuhConnector"]
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { TaskDefinition } from "@/shared/tools/taskSchema";
import { useProgressStore } from "@/core/store";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { YuhConnector } from "@/shared/tools/YuhConnector";
import { generateSwissWealthAnalysis } from "./ai-logic";

type TaskRendererProps = {
  moduleId: string;
  stageId: string;
  tasks: TaskDefinition[];
};

const INPUT_TASK_ID = "identify-asset";

const renderParagraphs = (content: string) => {
  return content.split("\n\n").map((paragraph, index) => (
    <p key={`analysis-${index}`} className="leading-relaxed text-slate-200">
      {paragraph}
    </p>
  ));
};

export const TaskRenderer = ({ moduleId, stageId, tasks }: TaskRendererProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTasks, setCompletedTasksLocal] = useState<
    Record<string, boolean>
  >({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [analysisSeed, setAnalysisSeed] = useState(0);

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

  const currentTask = tasks[currentIndex];
  const isLastStep = currentIndex === tasks.length - 1;
  const assetInput = inputValues[INPUT_TASK_ID] ?? "";

  const analysis = useMemo(() => {
    return generateSwissWealthAnalysis(assetInput);
  }, [assetInput, analysisSeed]);

  const handleNext = () => {
    if (!currentTask) return;
    setCompletedTasksLocal((prev) => ({
      ...prev,
      [currentTask.id]: true,
    }));

    if (!isLastStep) {
      setCurrentIndex((prev) => Math.min(tasks.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const canAdvance =
    currentTask?.type !== "input" || assetInput.trim().length > 0;

  if (!currentTask) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {stageId} / {moduleId}
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            AI-Asset-Coach
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Deploy AI to stress-test a single asset before it enters the Yuh
            wealth engine.
          </p>
        </div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>
            Step {currentIndex + 1} of {tasks.length}
          </span>
          <span>
            {Object.values(completedTasks).filter(Boolean).length} completed
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200/80">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${Math.round(((currentIndex + 1) / tasks.length) * 100)}%`,
            }}
          />
        </div>
      </header>

      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {currentTask.type.replace("-", " ")}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {currentTask.title}
            </h2>
            {currentTask.description ? (
              <p className="mt-2 text-sm text-slate-500">
                {currentTask.description}
              </p>
            ) : null}
          </div>

          {currentTask.type === "input" ? (
            <div className="space-y-2">
              {currentTask.inputLabel ? (
                <label className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  {currentTask.inputLabel}
                </label>
              ) : null}
              <input
                className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none"
                onChange={(event) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [currentTask.id]: event.target.value,
                  }))
                }
                placeholder={currentTask.placeholder ?? "Type here"}
                type="text"
                value={inputValues[currentTask.id] ?? ""}
              />
            </div>
          ) : null}

          {currentTask.type === "ai-coach" ? (
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-950 px-5 py-5 text-slate-100 shadow-inner">
              <p className="text-xs uppercase tracking-[0.26em] text-emerald-400">
                AI-Generated Assessment
              </p>
              <div className="space-y-4 text-sm">
                {renderParagraphs(analysis)}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => setAnalysisSeed((prev) => prev + 1)}
                >
                  Regenerate Insight
                </Button>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Prompted by Swiss wealth standards
                </span>
              </div>
              {currentTask.prompt ? (
                <p className="text-xs leading-relaxed text-slate-400">
                  Prompt: {currentTask.prompt}
                </p>
              ) : null}
            </div>
          ) : null}

          {currentTask.type === "tool-action" ? (
            <div className="flex flex-wrap items-center gap-4">
              {currentTask.toolId === "yuh-connector" ? (
                <YuhConnector
                  action={currentTask.action}
                  amount={currentTask.amount}
                  currency={currentTask.currency}
                  label={currentTask.actionLabel}
                />
              ) : null}
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Tool: {currentTask.toolId}
              </span>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            {currentTask.id}
          </span>
          <Button
            variant="action"
            size="sm"
            onClick={handleNext}
            disabled={!canAdvance}
          >
            {isLastStep ? "Complete Module" : "Continue"}
          </Button>
        </div>
      </div>
    </section>
  );
};
