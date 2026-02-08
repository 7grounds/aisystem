/**
 * @MODULE_ID shared.components.dynamic-payload-renderer
 * @STAGE global
 * @DATA_INPUTS ["payload"]
 * @REQUIRED_TOOLS []
 */
"use client";

import type { Json } from "@/core/types/database.types";

type DynamicPayloadRendererProps = {
  payload: Json;
  depth?: number;
};

const isRecord = (value: Json): value is Record<string, Json> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isArrayOfRecords = (value: Json): value is Record<string, Json>[] =>
  Array.isArray(value) && value.every((item) => isRecord(item));

const renderPrimitive = (value: Json) => {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

export const DynamicPayloadRenderer = ({
  payload,
  depth = 0,
}: DynamicPayloadRendererProps) => {
  if (depth > 2) {
    return (
      <pre className="whitespace-pre-wrap text-xs text-slate-400">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return <p className="text-xs text-slate-400">No data.</p>;
    }

    if (isArrayOfRecords(payload)) {
      const keys = Array.from(
        payload.reduce((acc, item) => {
          Object.keys(item).forEach((key) => acc.add(key));
          return acc;
        }, new Set<string>()),
      );

      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {keys.map((key) => (
                  <th key={key} className="pb-2 pr-4">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.map((row, index) => (
                <tr key={index} className="border-t border-slate-800/60">
                  {keys.map((key) => (
                    <td key={key} className="py-2 pr-4 align-top">
                      <DynamicPayloadRenderer
                        payload={row[key]}
                        depth={depth + 1}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <ul className="space-y-1 text-xs text-slate-300">
        {payload.map((item, index) => (
          <li key={index}>
            <DynamicPayloadRenderer payload={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(payload)) {
    const entries = Object.entries(payload);
    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
              {key}
            </span>
            <div className="text-xs text-slate-300">
              <DynamicPayloadRenderer payload={value} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-xs text-slate-300">{renderPrimitive(payload)}</span>;
};
