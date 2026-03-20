/**
 * @MODULE_ID app.history
 * @STAGE global
 * @DATA_INPUTS ["universal_history"]
 * @REQUIRED_TOOLS ["supabase-js"]
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/core/supabase";
import type { Database } from "@/core/types/database.types";

type HistoryRow = Database["public"]["Tables"]["universal_history"]["Row"];

type ParsedEntry =
  | { kind: "asset_analysis"; id: string; createdAt: string | null; assetName: string; isin: string; analysis: string; fee: number | null; currency: string }
  | { kind: "management_log"; id: string; createdAt: string | null; agentName: string; summary: string; details: string | null }
  | { kind: "conversation"; id: string; createdAt: string | null; messages: { role: string; content: string }[] }
  | { kind: "dev_task"; id: string; createdAt: string | null; task: string }
  | { kind: "welcome_note"; id: string; createdAt: string | null; title: string; message: string }
  | { kind: "unknown"; id: string; createdAt: string | null; raw: string };

const parseEntry = (row: HistoryRow): ParsedEntry => {
  const payload = row.payload;

  if (Array.isArray(payload)) {
    const messages = payload
      .filter((item): item is { role: string; content: string } =>
        typeof item === "object" && item !== null && "role" in item && "content" in item,
      )
      .map((item) => ({ role: String(item.role), content: String(item.content) }));
    return { kind: "conversation", id: row.id, createdAt: row.created_at, messages };
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const type = typeof record.type === "string" ? record.type : null;

    if (type === "asset_analysis") {
      return {
        kind: "asset_analysis",
        id: row.id,
        createdAt: row.created_at,
        assetName: typeof record.asset_name === "string" ? record.asset_name : "Unknown Asset",
        isin: typeof record.isin === "string" ? record.isin : "",
        analysis: typeof record.analysis === "string" ? record.analysis : "",
        fee: typeof record.fee === "number" ? record.fee : null,
        currency: typeof record.currency === "string" ? record.currency : "CHF",
      };
    }

    if (type === "management_log") {
      return {
        kind: "management_log",
        id: row.id,
        createdAt: row.created_at,
        agentName: typeof record.agent_name === "string" ? record.agent_name : "Agent",
        summary: typeof record.summary === "string" ? record.summary : "",
        details: typeof record.details === "string" ? record.details : null,
      };
    }

    if (type === "dev_task") {
      return {
        kind: "dev_task",
        id: row.id,
        createdAt: row.created_at,
        task: typeof record.task === "string" ? record.task : "",
      };
    }

    if (type === "welcome_note") {
      return {
        kind: "welcome_note",
        id: row.id,
        createdAt: row.created_at,
        title: typeof record.title === "string" ? record.title : "Welcome",
        message: typeof record.message === "string" ? record.message : "",
      };
    }
  }

  return {
    kind: "unknown",
    id: row.id,
    createdAt: row.created_at,
    raw: JSON.stringify(payload),
  };
};

const formatTimestamp = (value: string | null) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AssetAnalysisCard = ({ entry }: { entry: Extract<ParsedEntry, { kind: "asset_analysis" }> }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">AI Asset Analysis</p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">
          {entry.assetName}
          {entry.isin ? <span className="ml-2 text-sm font-normal text-slate-500">({entry.isin})</span> : null}
        </h3>
      </div>
      <span className="text-xs text-slate-400">{formatTimestamp(entry.createdAt)}</span>
    </div>
    {entry.fee !== null ? (
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
        Fee: {entry.currency} {entry.fee.toFixed(2)}
      </p>
    ) : null}
    {entry.analysis ? (
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
        {entry.analysis.split("\n\n").slice(0, 3).map((paragraph, index) => (
          <p key={`${entry.id}-p-${index}`}>{paragraph}</p>
        ))}
      </div>
    ) : null}
  </div>
);

const ConversationCard = ({ entry }: { entry: Extract<ParsedEntry, { kind: "conversation" }> }) => {
  const visibleMessages = entry.messages.filter((m) => m.role !== "system");
  if (visibleMessages.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Conversation</p>
        <span className="text-xs text-slate-400">{formatTimestamp(entry.createdAt)}</span>
      </div>
      <div className="mt-4 space-y-3">
        {visibleMessages.map((message, index) => (
          <div
            key={`${entry.id}-msg-${index}`}
            className={[
              "rounded-xl px-4 py-3 text-sm leading-relaxed",
              message.role === "user"
                ? "ml-6 bg-emerald-50 text-slate-800"
                : "mr-6 bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {message.role === "user" ? "You" : "AI"}
            </p>
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};

const ManagementLogCard = ({ entry }: { entry: Extract<ParsedEntry, { kind: "management_log" }> }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Agent Update</p>
        <h3 className="mt-1 text-sm font-semibold text-slate-900">{entry.agentName}</h3>
      </div>
      <span className="text-xs text-slate-400">{formatTimestamp(entry.createdAt)}</span>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-slate-600">{entry.summary}</p>
    {entry.details ? (
      <p className="mt-2 text-xs text-slate-400">{entry.details}</p>
    ) : null}
  </div>
);

const DevTaskCard = ({ entry }: { entry: Extract<ParsedEntry, { kind: "dev_task" }> }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Task Dispatched</p>
      <span className="text-xs text-slate-400">{formatTimestamp(entry.createdAt)}</span>
    </div>
    <p className="mt-3 text-sm text-slate-700">{entry.task}</p>
  </div>
);

const WelcomeNoteCard = ({ entry }: { entry: Extract<ParsedEntry, { kind: "welcome_note" }> }) => (
  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">{entry.title}</p>
      <span className="text-xs text-slate-400">{formatTimestamp(entry.createdAt)}</span>
    </div>
    <p className="mt-3 text-sm text-slate-600">{entry.message}</p>
  </div>
);

const HistoryEntryCard = ({ entry }: { entry: ParsedEntry }) => {
  if (entry.kind === "asset_analysis") return <AssetAnalysisCard entry={entry} />;
  if (entry.kind === "conversation") return <ConversationCard entry={entry} />;
  if (entry.kind === "management_log") return <ManagementLogCard entry={entry} />;
  if (entry.kind === "dev_task") return <DevTaskCard entry={entry} />;
  if (entry.kind === "welcome_note") return <WelcomeNoteCard entry={entry} />;
  return null;
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      let query = supabase
        .from("universal_history")
        .select("id, user_id, organization_id, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error: fetchError } = await query;

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      const parsed = (data ?? []).map((row) => parseEntry(row as HistoryRow));
      setEntries(parsed);
      setIsLoading(false);
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Zasterix</p>
        <h1 className="text-3xl font-semibold text-slate-900">Chat History</h1>
        <p className="text-sm text-slate-500">
          Your AI interactions, asset analyses, and agent updates — all in one place.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
          Failed to load history: {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/80"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-600">No history yet</p>
          <p className="mt-2 text-xs text-slate-400">
            Your AI interactions will appear here once you start using the platform.
          </p>
          <Link
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
            href="/stage-1/asset-coach"
          >
            Start with Asset Coach
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <HistoryEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
