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

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "type" in payload &&
    typeof (payload as Record<string, Json>).type === "string" &&
    (payload as Record<string, Json>).type === "medical"
  ) {
    const record = payload as Record<string, Json>;
    const labs = record.labs;
    const entries = Array.isArray(labs) ? labs : [];

    return (
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">
          Medizin-Datensatz
        </div>
        {entries.length === 0 ? (
          <div className="text-xs text-slate-300">
            <DynamicPayloadRenderer payload={payload} depth={depth + 1} />
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => {
              if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
                return (
                  <DynamicPayloadRenderer
                    key={`lab-${index}`}
                    payload={entry}
                    depth={depth + 1}
                  />
                );
              }

              const lab = entry as Record<string, Json>;
              const name = typeof lab.name === "string" ? lab.name : "Lab";
              const unit = typeof lab.unit === "string" ? lab.unit : "";
              const value =
                typeof lab.value === "number"
                  ? lab.value
                  : typeof lab.result === "number"
                    ? lab.result
                    : null;
              const refMin =
                typeof lab.refMin === "number"
                  ? lab.refMin
                  : typeof lab.min === "number"
                    ? lab.min
                    : null;
              const refMax =
                typeof lab.refMax === "number"
                  ? lab.refMax
                  : typeof lab.max === "number"
                    ? lab.max
                    : null;

              const withinRange =
                value !== null &&
                refMin !== null &&
                refMax !== null &&
                value >= refMin &&
                value <= refMax;

              const barColor = withinRange ? "bg-emerald-500" : "bg-rose-400";
              const ratio =
                value !== null && refMin !== null && refMax !== null
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        ((value - refMin) / (refMax - refMin)) * 100,
                      ),
                    )
                  : 0;

              return (
                <div
                  key={`lab-${index}`}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>{name}</span>
                    <span>
                      {value !== null ? value.toFixed(2) : "--"} {unit}
                    </span>
                  </div>
                  {refMin !== null && refMax !== null ? (
                    <div className="mt-2 space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-800/80">
                        <div
                          className={`h-2 rounded-full ${barColor}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        <span>
                          Normal: {refMin} - {refMax} {unit}
                        </span>
                        <span>{withinRange ? "Im Bereich" : "Abweichung"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Kein Referenzbereich angegeben
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
