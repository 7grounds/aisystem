/**
 * @MODULE_ID shared.components.agent-console
 * @STAGE global
 * @DATA_INPUTS ["entries"]
 * @REQUIRED_TOOLS []
 */
"use client";

import { useEffect, useMemo, useState } from "react";

type AgentConsoleProps = {
  entries: string[];
  collapsedByDefault?: boolean;
};

export const AgentConsole = ({
  entries,
  collapsedByDefault = true,
}: AgentConsoleProps) => {
  const [isOpen, setIsOpen] = useState(!collapsedByDefault);
  const [renderedEntries, setRenderedEntries] = useState<string[]>([]);

  const nextEntries = useMemo(() => entries.filter(Boolean), [entries]);

  useEffect(() => {
    let isActive = true;
    const timeouts: number[] = [];

    if (nextEntries.length === 0) {
      setRenderedEntries([]);
      return () => {
        isActive = false;
        timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      };
    }

    setRenderedEntries((prev) => {
      if (prev.length > nextEntries.length) {
        return nextEntries.slice(0);
      }
      return prev;
    });

    const startIndex = Math.min(renderedEntries.length, nextEntries.length);

    for (let index = startIndex; index < nextEntries.length; index += 1) {
      const timeoutId = window.setTimeout(() => {
        if (!isActive) return;
        setRenderedEntries((prev) => {
          if (prev.length > index) {
            return prev;
          }
          return [...prev, nextEntries[index]];
        });
      }, (index - startIndex) * 50);
      timeouts.push(timeoutId);
    }

    return () => {
      isActive = false;
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [nextEntries, renderedEntries.length]);

  return (
    <div className="space-y-2">
      <button
        className="text-xs uppercase tracking-[0.24em] text-slate-400 hover:text-emerald-300"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Hide Agent Reasoning" : "Show Agent Reasoning"}
      </button>
      {isOpen ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-[11px] leading-relaxed text-emerald-500">
          {renderedEntries.length ? (
            <ul className="space-y-1">
              {renderedEntries.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No agent activity yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};
